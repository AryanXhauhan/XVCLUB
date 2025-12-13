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

    // Verify signature
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest('hex');

    if (expected !== signature) {
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

        // Idempotency: check if order already exists
        const existingOrderQuery = await adminDb
            .collection('orders')
            .where('razorpayOrderId', '==', razorpayOrderId)
            .get();

        if (!existingOrderQuery.empty) {
            console.log(`Order already exists for razorpayOrder ${razorpayOrderId}, skipping duplicate`);
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

        // Create order in Firestore
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

        const orderRef = await adminDb.collection('orders').add(orderData);
        const orderId = orderRef.id;

        console.log(`Order created: ${orderId} for razorpayOrder ${razorpayOrderId}`);

        // Decrement stock for each item
        for (const item of items) {
            try {
                await adminDb.collection('products').doc(item.productId).update({
                    stock: FieldValue.increment(-item.quantity),
                });
                console.log(`Stock decremented for product ${item.productId}: -${item.quantity}`);
            } catch (error) {
                console.error(`Failed to decrement stock for product ${item.productId}:`, error);
            }
        }

        // Send confirmation email
        const order: Order = {
            id: orderId,
            ...orderData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await sendOrderConfirmationEmail(order);

        return NextResponse.json({ received: true, orderId });
    } catch (error: any) {
        console.error('Error processing Razorpay webhook:', error);
        return NextResponse.json({ error: error.message }, { status: 200 });
    }
}

