
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

import { initAdmin } from '@/lib/firebase-admin';
import { OrderItem, ShippingAddress } from '@/lib/types';
import { analyticsService, EventType } from '@/lib/analytics/analyticsSystem';
import { fraudDetectionService } from '@/lib/fraud/fraudDetectionSystem';
import { GlobalTaxService } from '@/lib/tax/globalTaxSystem';
import { products } from '@/lib/data/products';


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

        // CRITICAL: Validate all required customer fields
        if (!customerName || customerName.trim() === '') {
            return NextResponse.json(
                { error: 'Full name is required' },
                { status: 400 }
            );
        }

        if (!customerEmail || customerEmail.trim() === '') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        if (!customerPhone || customerPhone.trim() === '') {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        if (!shippingAddress) {
            return NextResponse.json(
                { error: 'Shipping address is required' },
                { status: 400 }
            );
        }

        // Validate shipping address fields
        if (!shippingAddress.line1 || shippingAddress.line1.trim() === '') {
            return NextResponse.json(
                { error: 'Address line 1 is required' },
                { status: 400 }
            );
        }

        if (!shippingAddress.city || shippingAddress.city.trim() === '') {
            return NextResponse.json(
                { error: 'City is required' },
                { status: 400 }
            );
        }

        if (!shippingAddress.state || shippingAddress.state.trim() === '') {
            return NextResponse.json(
                { error: 'State is required' },
                { status: 400 }
            );
        }

        if (!shippingAddress.postalCode || shippingAddress.postalCode.trim() === '') {
            return NextResponse.json(
                { error: 'Postal code is required' },
                { status: 400 }
            );
        }

        if (!shippingAddress.country || shippingAddress.country.trim() === '') {
            return NextResponse.json(
                { error: 'Country is required' },
                { status: 400 }
            );
        }




        // CRITICAL: Determine currency based on shipping country
        const isIndia = shippingAddress.country.toLowerCase() === 'india';
        const currency = isIndia ? 'INR' : 'USD';
        const amountMultiplier = isIndia ? 100 : 100; // paise/cents both use ×100

        // CRITICAL: Re-fetch products from code and validate
        const validatedItems: OrderItem[] = [];
        let totalAmount = 0;

        for (const cartItem of items) {
            // Find product in code (instead of Firestore)
            const productData = products.find(p => p.id === cartItem.productId);

            if (!productData) {
                return NextResponse.json(
                    { error: `Product ${cartItem.productId} not found` },
                    { status: 400 }
                );
            }

            // Validate stock
            if (productData.stock < cartItem.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for ${productData.name}` },
                    { status: 400 }
                );
            }

            // Use server-side price based on currency (never trust client)
            const serverPrice = isIndia ? (productData.price.inr || 0) : (productData.price.usd || 0);
            if (serverPrice === 0) {
                return NextResponse.json(
                    { error: `Invalid price for ${productData.name}` },
                    { status: 400 }
                );
            }
            const itemTotal = serverPrice * cartItem.quantity;
            totalAmount += itemTotal;

            validatedItems.push({
                productId: cartItem.productId,
                productName: productData.name,
                shade: cartItem.shade,
                price: serverPrice,
                quantity: cartItem.quantity,
                currency: currency,
            });
        }



        // Generate session ID for analytics
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Calculate taxes based on shipping address
        const taxCalculation = GlobalTaxService.calculateTax(totalAmount, {
            country: shippingAddress.country,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode
        });

        const finalAmount = taxCalculation.total;

        // Run fraud detection before order creation
        try {
            const fraudContext = {
                order: {
                    id: 'pending',
                    total: finalAmount,
                    items: validatedItems,
                    customerEmail,
                    customerPhone,
                    shippingAddress,
                    razorpayOrderId: null
                } as any,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                sessionId: sessionId,
                email: customerEmail
            };

            const fraudFlags = await fraudDetectionService.evaluateFraudRisk(fraudContext);
            const criticalFlags = fraudFlags.filter(flag => flag.severity === 'critical' || flag.severity === 'high');

            if (criticalFlags.length > 0) {
                console.warn('High-risk order blocked by fraud detection:', criticalFlags);
                return NextResponse.json(
                    { error: 'Order cannot be processed at this time. Please contact support.' },
                    { status: 403 }
                );
            }
        } catch (fraudError) {
            // Log fraud error but don't block checkout
            console.error('Fraud detection failed:', fraudError);
        }

        // Log checkout started analytics (don't block if fails)
        try {
            await analyticsService.logCheckoutStarted(
                finalAmount,
                validatedItems.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price
                })),
                sessionId
            );
        } catch (analyticsError) {
            console.error('Analytics logging failed:', analyticsError);
        }

        // Verify payment gateway keys are loaded
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            return NextResponse.json(
                { error: 'Payment gateway configuration error: Missing API keys' },
                { status: 500 }
            );
        }

        // Create Razorpay order (instantiate SDK lazily to avoid build-time errors)
        const razorpay = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret,
        });

        // Verify amount is in smallest currency unit (paise/cents)
        const amountInMinorUnits = finalAmount * amountMultiplier;

        if (amountInMinorUnits <= 0) {
            return NextResponse.json(
                { error: 'Invalid payment amount' },
                { status: 400 }
            );
        }

        // Create Razorpay order with detailed notes including tax info
        const razorpayOrder = await razorpay.orders.create({
            amount: amountInMinorUnits, // paise/cents (smallest currency unit)
            currency: currency,
            receipt: `rcpt_${Date.now()}`,
            notes: {
                customerName,
                customerEmail,
                customerPhone,
                address: JSON.stringify(shippingAddress),
                items: JSON.stringify(validatedItems),
                currency: currency,
                // Add tax information to notes
                subtotal: taxCalculation.subtotal,
                taxAmount: taxCalculation.taxAmount,
                taxBreakdown: JSON.stringify(taxCalculation.taxBreakdown),
                finalAmount: finalAmount
            },
        });

        // Log payment initiated analytics (don't block if fails)
        try {
            await analyticsService.logPaymentInitiated(
                finalAmount,
                currency,
                razorpayOrder.id,
                sessionId
            );
        } catch (analyticsError) {
            console.error('Analytics payment initiation logging failed:', analyticsError);
        }

        console.log('✅ Razorpay order created successfully:', {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            status: razorpayOrder.status
        });

        return NextResponse.json({
            key: razorpayKeyId,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
        });
    } catch (error: any) {
        // Enhanced error logging to expose the real issue
        console.error('💥 Checkout session error - Full details:', {
            message: error.message,
            name: error.name,
            code: error.code,
            status: error.status,
            response: error.response,
            stack: error.stack,
            fullError: error
        });

        // Log specific Razorpay errors
        if (error.name === 'Error' && error.status) {
            console.error('🔥 Razorpay API Error:', {
                status: error.status,
                message: error.message,
                response: error.response
            });
        }

        // Return specific error message instead of generic one
        const errorMessage = error?.message || error?.response?.error || 'Checkout session failed';
        console.error('📤 Returning error to client:', errorMessage);

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

