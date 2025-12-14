# XVC ECOMMERCE - LAST MILE WIRING IMPLEMENTATION

## 1. CHECKOUT SESSION API - ANALYTICS + FRAUD + TAX WIRING

**File:** `app/api/create-checkout-session/route.ts`

**Add these imports at the top:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

import { initAdmin } from '@/lib/firebase-admin';
import { OrderItem, ShippingAddress } from '@/lib/types';
import { analyticsService, EventType } from '@/lib/analytics/analyticsSystem';
import { fraudDetectionService } from '@/lib/fraud/fraudDetectionSystem';
import { GlobalTaxService } from '@/lib/tax/globalTaxSystem';
```

**Replace the section after validation and before Razorpay order creation (around line 95-120):**
```typescript
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

        return NextResponse.json({
            key: razorpayKeyId,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
        });
```

---

## 2. RAZORPAY WEBHOOK - ANALYTICS + FRAUD + SHIPPING WIRING

**File:** `app/api/webhooks/razorpay/route.ts`

**Add these imports at the top:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';

import { initAdmin } from '@/lib/firebase-admin';
import { Order, OrderItem, ShippingAddress } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmation';
import { analyticsService, EventType } from '@/lib/analytics/analyticsSystem';
import { fraudDetectionService } from '@/lib/fraud/fraudDetectionSystem';
import { ShiprocketService } from '@/lib/shipping/shiprocketIntegration';
```

**Replace the section after order creation and before email sending (around line 95-110):**
```typescript
        console.log(`Order created: ${razorpayOrderId} for razorpayOrder ${razorpayOrderId}`);

        // Build an order object for additional services
        const orderForServices: Order = {
            id: razorpayOrderId,
            ...orderData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Run fraud detection on successful payment (don't block order processing)
        try {
            const fraudContext = {
                order: orderForServices,
                ipAddress: payload.ip_address || 'unknown',
                email: customerEmail,
                sessionId: `session_${razorpayOrderId}`,
                userId: null // No user auth in current system
            };

            await fraudDetectionService.evaluateFraudRisk(fraudContext);
        } catch (fraudError) {
            console.error('Fraud detection failed:', fraudError);
        }

        // Log payment success analytics (don't block order processing)
        try {
            const sessionId = `session_${Date.now()}`;
            await analyticsService.logPaymentSuccess(
                razorpayOrderId,
                (amountCaptured || fetchedOrder.amount) / 100,
                fetchedOrder.currency,
                razorpayPaymentId || '',
                sessionId
            );

            await analyticsService.logEvent({
                eventType: EventType.ORDER_COMPLETED,
                sessionId,
                orderId: razorpayOrderId,
                metadata: {
                    orderValue: (amountCaptured || fetchedOrder.amount) / 100,
                    paymentAmount: (amountCaptured || fetchedOrder.amount) / 100,
                    paymentCurrency: fetchedOrder.currency,
                    orderStatus: 'paid'
                }
            });
        } catch (analyticsError) {
            console.error('Analytics logging failed:', analyticsError);
        }

        // Create shipping shipment (don't block order processing if fails)
        try {
            const shippingService = new ShiprocketService();
            const shippingResult = await shippingService.createShipment(orderForServices);

            if (shippingResult.success && shippingResult.shipmentDetails) {
                // Update order with shipping information
                await adminDb.collection('orders').doc(razorpayOrderId).update({
                    shipping: {
                        shipmentId: shippingResult.shipmentDetails.shipment_id,
                        awbCode: shippingResult.shipmentDetails.awb_code,
                        courierName: shippingResult.shipmentDetails.courier_name,
                        trackingUrl: shippingResult.shipmentDetails.tracking_url,
                        status: 'shipped'
                    }
                });
            }
        } catch (shippingError) {
            console.error('Shipping creation failed:', shippingError);
        }

        await sendOrderConfirmationEmail(orderForEmail);
```

---

## 3. SHIPPING SERVICE TYPESCRIPT FIX

**File:** `lib/shipping/shiprocketIntegration.ts`

**Replace the authenticate method (around line 85-120):**
```typescript
private async authenticate(): Promise<string> {
    if (!this.credentials?.email || !this.credentials?.password) {
        throw new Error('Shiprocket credentials not configured');
    }

    // Reuse token if still valid
    if (this.authToken && Date.now() < this.tokenExpiry) {
        return this.authToken;
    }

    try {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.credentials),
        });

        const data: { token?: string; message?: string } = await response.json();

        if (!response.ok || !data.token) {
            throw new Error(data.message || 'Authentication failed');
        }

        // Store token and set expiry
        this.authToken = data.token;
        this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

        return data.token;
    } catch (error) {
        console.error('Shiprocket authentication error:', error);
        throw new Error('Failed to authenticate with Shiprocket');
    }
}
```

---

## 4. ORDER TYPESCRIPT FIX

**File:** `lib/types.ts`

**Add tax-related fields to Order interface:**
```typescript
export interface Order {
    id: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string; // E.164 format
    customerPhoneInfo?: InternationalPhoneInfo;
    shippingAddress: ShippingAddress;
    billingAddress?: ShippingAddress; // Optional billing address
    items: OrderItem[];
    total: number;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'pending_review' | 'blocked';
    paymentStatus: 'paid' | 'pending' | 'refunded';
    createdAt: any;
    updatedAt: any;
    lastUpdated?: any;
    fulfillmentNotes?: string;
    // Tax-related fields
    subtotal?: number;
    taxAmount?: number;
    taxBreakdown?: any;
    finalAmount?: number;
    shippingCost?: number;
    discountAmount?: number;
    // Shipping information
    shipping?: {
        shipmentId?: string;
        awbCode?: string;
        courierName?: string;
        trackingUrl?: string;
        status?: string;
    };
    // Fraud detection fields
    fraudFlagId?: string;
    fraudFlags?: any[];
    heldAt?: any;
    heldReason?: string;
    blockedAt?: any;
    blockedReason?: string;
}
```

---

## 5. ANALYTICS SYSTEM TYPESCRIPT FIX

**File:** `lib/analytics/analyticsSystem.ts`

**Replace methods with null-safe implementations:**

**Replace logProductView method:**
```typescript
async logProductView(productId: string, productName: string, category: string, sessionId: string, userId?: string): Promise<void> {
    try {
        // Only run on client side
        if (typeof window === 'undefined') return;
        
        await this.logEvent({
            eventType: EventType.PRODUCT_VIEWED,
            userId,
            sessionId,
            productId,
            metadata: {
                productName,
                productCategory: category,
                pageUrl: typeof window !== 'undefined' ? window.location.href : '',
                referrer: typeof window !== 'undefined' ? document.referrer : ''
            }
        });
    } catch (error) {
        console.error('Failed to log product view:', error);
    }
}
```

**Replace logAddToCart method:**
```typescript
async logAddToCart(productId: string, productName: string, price: number, quantity: number, sessionId: string, userId?: string): Promise<void> {
    try {
        await this.logEvent({
            eventType: EventType.ADD_TO_CART,
            userId,
            sessionId,
            productId,
            metadata: {
                productName,
                productPrice: price,
                cartItemCount: quantity,
                pageUrl: typeof window !== 'undefined' ? window.location.href : ''
            }
        });
    } catch (error) {
        console.error('Failed to log add to cart:', error);
    }
}
```

**Replace logCheckoutStarted method:**
```typescript
async logCheckoutStarted(cartValue: number, cartItems: CartItemData[], sessionId: string, userId?: string): Promise<void> {
    try {
        await this.logEvent({
            eventType: EventType.CHECKOUT_STARTED,
            userId,
            sessionId,
            metadata: {
                cartValue,
                cartItemCount: cartItems.length,
                cartItems
            }
        });
    } catch (error) {
        console.error('Failed to log checkout start:', error);
    }
}
```

---

## SUMMARY OF CHANGES

✅ **Analytics Wiring:**
- Checkout start: Logged in checkout API before payment
- Payment initiated: Logged in checkout API after Razorpay order creation
- Payment success: Logged in webhook after successful payment
- Order completed: Logged in webhook after order creation

✅ **Fraud Detection Wiring:**
- Pre-checkout: Evaluated in checkout API before Razorpay order creation
- Post-payment: Evaluated in webhook after successful payment
- High/Critical risk orders are blocked with 403 response
- Failures don't block order processing (logged only)

✅ **Tax Calculation Wiring:**
- Tax calculated in checkout API using GlobalTaxService
- Tax breakdown stored in order notes
- Final amount (subtotal + tax) used for Razorpay order
- Order interface updated with tax fields

✅ **Shipping Wiring:**
- Shipment created in webhook after successful order creation
- Shipping details stored in order document
- Failures don't block order processing (logged only)

✅ **TypeScript Fixes:**
- Fixed authenticate() return type consistency
- Added null-safe window/document access
- Updated Order interface with all required fields
- Fixed analytics method implementations

All changes preserve existing logic and ensure that failure of analytics, fraud detection, or shipping does NOT block the core payment/order flow.
