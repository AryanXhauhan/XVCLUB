import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { initAdmin } from '@/lib/firebase-admin';
import { OrderItem, ShippingAddress } from '@/lib/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {

    try {
        const { adminDb } = initAdmin();
        const body = await request.json();
        const { items, customerName, customerEmail, customerPhone, shippingAddress } = body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Cart is empty' },
                { status: 400 }
            );
        }

        if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
            return NextResponse.json(
                { error: 'Missing required customer information' },
                { status: 400 }
            );
        }

        // CRITICAL: Re-fetch products from Firestore and validate
        const validatedItems: OrderItem[] = [];
        let totalAmount = 0;

        for (const cartItem of items) {
            // Fetch product from Firestore
            const productDoc = await adminDb.collection('products').doc(cartItem.productId).get();

            if (!productDoc.exists) {
                return NextResponse.json(
                    { error: `Product ${cartItem.productId} not found` },
                    { status: 400 }
                );
            }

            const productData = productDoc.data()!;

            // Validate stock
            if (productData.stock < cartItem.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for ${productData.name}` },
                    { status: 400 }
                );
            }

            // Use server-side price (never trust client)
            const serverPrice = productData.price.inr; // Use INR for now
            const itemTotal = serverPrice * cartItem.quantity;
            totalAmount += itemTotal;

            validatedItems.push({
                productId: cartItem.productId,
                productName: productData.name,
                shade: cartItem.shade,
                price: serverPrice,
                quantity: cartItem.quantity,
            });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: validatedItems.map((item) => ({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.productName,
                        description: item.shade ? `Shade: ${item.shade}` : undefined,
                    },
                    unit_amount: item.price * 100, // Convert to paise
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout`,
            metadata: {
                customerName,
                customerEmail,
                customerPhone,
                address: JSON.stringify(shippingAddress),
                items: JSON.stringify(validatedItems),
            },
            shipping_address_collection: {
                allowed_countries: ['IN'], // India only for now
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Checkout session error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}

