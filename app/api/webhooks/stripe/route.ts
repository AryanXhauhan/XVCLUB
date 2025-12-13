import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';

import { initAdmin } from '@/lib/firebase-admin';
import { Order, OrderItem, ShippingAddress } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmation';

// Instantiate Razorpay lazily inside handler to avoid build-time env requirement

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Verify signature using timing-safe compare
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const expectedBuf = crypto.createHmac('sha256', secret).update(body).digest();
    let signatureBuf: Buffer;
    try {
        signatureBuf = Buffer.from(signature, 'hex');
    } catch (e) {
        console.error('Invalid signature format');
        return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 });
    }

    if (signatureBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(expectedBuf, signatureBuf)) {
        console.error('Webhook signature mismatch');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(body);

    // Handle payment captured or order paid events
    const eventType = payload.event;

    if (eventType !== 'payment.captured' && eventType !== 'order.paid') {
        return NextResponse.json({ received: true });
    }

    try {
        const { adminDb } = initAdmin();

        // Extract payment and order IDs
        const paymentEntity = payload.payload?.payment?.entity;
        const orderEntity = payload.payload?.order?.entity;

        const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
        const razorpayPaymentId = paymentEntity?.id;
        const amountCaptured = paymentEntity?.amount || orderEntity?.amount;

        if (!razorpayOrderId) {
            console.error('No order id in webhook payload');
            return NextResponse.json({ received: true });
        }

        // Fetch the Razorpay order to get notes (customer details + items)
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const fetchedOrder = await razorpay.orders.fetch(razorpayOrderId);
        const notes = fetchedOrder.notes || {};

        const customerName = String(notes.customerName || '');
        const customerEmail = String(notes.customerEmail || '');
        const customerPhone = String(notes.customerPhone || '');
        const shippingAddress: ShippingAddress = notes.address ? JSON.parse(String(notes.address)) : ({} as ShippingAddress);
        const items: OrderItem[] = notes.items ? JSON.parse(String(notes.items)) : [];

        // Prepare order data
        const orderData: Omit<Order, 'id'> = {
            razorpayOrderId,
            razorpayPaymentId: razorpayPaymentId,
            paymentStatus: 'paid',
            status: 'paid',
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            items,
            total: (amountCaptured || fetchedOrder.amount) / 100,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const orderRef = adminDb.collection('orders').doc(razorpayOrderId);

        // Run a transaction to create the order atomically and decrement stock safely
        let alreadyProcessed = false;
        await adminDb.runTransaction(async (tx) => {
            const orderSnap = await tx.get(orderRef);
            if (orderSnap.exists) {
                alreadyProcessed = true;
                return;
            }

            // For each item, check stock and decrement inside the transaction
            for (const item of items) {
                const prodRef = adminDb.collection('products').doc(item.productId);
                const prodSnap = await tx.get(prodRef);
                const currentStock = (prodSnap.data()?.stock || 0) as number;
                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.productId}`);
                }
                tx.update(prodRef, { stock: currentStock - item.quantity });
            }

            // Create the order document using razorpayOrderId as the document ID
            tx.set(orderRef, orderData);
        });

        if (alreadyProcessed) {
            console.log(`Order already exists for razorpayOrder ${razorpayOrderId}, skipping duplicate`);
            return NextResponse.json({ received: true });
        }

        console.log(`Order created: ${razorpayOrderId} for razorpayOrder ${razorpayOrderId}`);

        // Build an order object for email (use current time for client-side email representation)
        const orderForEmail: Order = {
            id: razorpayOrderId,
            ...orderData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await sendOrderConfirmationEmail(orderForEmail);

        return NextResponse.json({ received: true, orderId: razorpayOrderId });
    } catch (error: any) {
        console.error('Error processing Razorpay webhook:', error);
        // Return 500 so webhook sender can retry on failure
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}

