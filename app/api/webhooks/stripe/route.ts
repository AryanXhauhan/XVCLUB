import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { Order, OrderItem, ShippingAddress } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmation';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'No signature provided' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        // Step 1: Verify signature
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('Webhook signature verification failed:', error.message);
        return NextResponse.json(
            { error: `Webhook Error: ${error.message}` },
            { status: 400 }
        );
    }

    // Step 2: Check event type
    if (event.type !== 'checkout.session.completed') {
        return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // Step 3: Safety checks
    if (session.payment_status !== 'paid') {
        console.log('Payment not completed, skipping order creation');
        return NextResponse.json({ received: true });
    }

    if (!session.metadata) {
        console.error('No metadata in session');
        return NextResponse.json({ received: true });
    }

    try {
        // Step 4: Idempotency check - query for existing order
        const existingOrderQuery = await adminDb
            .collection('orders')
            .where('stripeSessionId', '==', session.id)
            .get();

        if (!existingOrderQuery.empty) {
            console.log(`Order already exists for session ${session.id}, skipping duplicate`);
            return NextResponse.json({ received: true });
        }

        // Parse metadata
        const customerName = session.metadata.customerName;
        const customerEmail = session.metadata.customerEmail;
        const customerPhone = session.metadata.customerPhone;
        const shippingAddress: ShippingAddress = JSON.parse(session.metadata.address);
        const items: OrderItem[] = JSON.parse(session.metadata.items);

        // Step 5: Create order in Firestore
        const orderData: Omit<Order, 'id'> = {
            stripeSessionId: session.id,
            paymentStatus: 'paid',
            status: 'paid',
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            items,
            total: session.amount_total! / 100, // Convert from paise to rupees
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const orderRef = await adminDb.collection('orders').add(orderData);
        const orderId = orderRef.id;

        console.log(`Order created: ${orderId} for session ${session.id}`);

        // Step 6: Decrement stock for each item
        for (const item of items) {
            try {
                await adminDb.collection('products').doc(item.productId).update({
                    stock: FieldValue.increment(-item.quantity),
                });
                console.log(`Stock decremented for product ${item.productId}: -${item.quantity}`);
            } catch (error) {
                console.error(`Failed to decrement stock for product ${item.productId}:`, error);
                // Continue with other items even if one fails
            }
        }

        // Step 7: Send confirmation email
        const order: Order = {
            id: orderId,
            ...orderData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await sendOrderConfirmationEmail(order);

        // Step 8: Return success
        return NextResponse.json({ received: true, orderId });
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        // Still return 200 to prevent Stripe from retrying
        return NextResponse.json(
            { error: error.message },
            { status: 200 }
        );
    }
}

