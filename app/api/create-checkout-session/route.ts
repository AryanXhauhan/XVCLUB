import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

import { initAdmin } from '@/lib/firebase-admin';
import { OrderItem, ShippingAddress } from '@/lib/types';


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

        // Create Razorpay order (instantiate SDK lazily to avoid build-time errors)
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: totalAmount * 100, // paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: {
                customerName,
                customerEmail,
                customerPhone,
                address: JSON.stringify(shippingAddress),
                items: JSON.stringify(validatedItems),
            },
        });

        return NextResponse.json({
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
        });
    } catch (error: any) {
        console.error('Checkout session error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}

