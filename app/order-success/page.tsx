'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Order } from '@/lib/types';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [order, setOrder] = useState<Order | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [pollTimeout, setPollTimeout] = useState(false);

    useEffect(() => {
        if (!sessionId) {
            return;
        }

        const fetchOrder = async () => {
            try {
                const q = query(
                    collection(db, 'orders'),
                    where('stripeSessionId', '==', sessionId),
                    limit(1)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    setOrder({
                        id: doc.id,
                        ...doc.data(),
                    } as Order);
                    setIsPolling(false);
                } else if (!pollTimeout) {
                    // Order not found yet, start polling
                    setIsPolling(true);
                }
            } catch (error) {
                console.error('Error fetching order:', error);
                setIsPolling(false);
            }
        };

        fetchOrder();

        // Poll every 2 seconds for up to 30 seconds
        if (!order && !pollTimeout) {
            const pollInterval = setInterval(() => {
                fetchOrder();
            }, 2000);

            const timeout = setTimeout(() => {
                setIsPolling(false);
                setPollTimeout(true);
                clearInterval(pollInterval);
            }, 30000);

            return () => {
                clearInterval(pollInterval);
                clearTimeout(timeout);
            };
        }
    }, [sessionId, order, pollTimeout]);

    if (!sessionId) {
        return (
            <main className="min-h-screen bg-xvc-offwhite">
                <section className="editorial-container py-20 md:py-32">
                    <h1 className="text-xvc-black mb-4">Invalid Order</h1>
                    <p className="text-xvc-graphite mb-8">
                        No session ID provided. Please check your order confirmation email.
                    </p>
                    <Button href="/">Return Home</Button>
                </section>
            </main>
        );
    }

    if (isPolling) {
        return (
            <main className="min-h-screen bg-xvc-offwhite">
                <section className="editorial-container py-20 md:py-32">
                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-xvc-black mb-4">Confirming your payment...</h1>
                        <p className="text-xvc-graphite mb-8">
                            Please wait while we verify your payment. This may take a few moments.
                        </p>
                        <div className="flex justify-center">
                            <div className="w-8 h-8 border-2 border-xvc-taupe border-t-xvc-black rounded-full animate-spin" />
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    if (pollTimeout && !order) {
        return (
            <main className="min-h-screen bg-xvc-offwhite">
                <section className="editorial-container py-20 md:py-32">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-xvc-black mb-4">Payment Processing</h1>
                        <p className="text-xvc-graphite mb-8">
                            Your payment is being processed. If you&apos;ve completed the payment, please check your email for confirmation.
                        </p>
                        <p className="text-xvc-graphite mb-8">
                            If you haven&apos;t received a confirmation email within a few minutes, please contact us at{' '}
                            <a href="mailto:support@xvc.com" className="text-xvc-black underline">
                                support@xvc.com
                            </a>
                        </p>
                        <Button href="/">Return Home</Button>
                    </div>
                </section>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-xvc-offwhite">
                <section className="editorial-container py-20 md:py-32">
                    <h1 className="text-xvc-black mb-4">Order Not Found</h1>
                    <p className="text-xvc-graphite mb-8">
                        We couldn&apos;t find your order. Please check your order confirmation email or contact support.
                    </p>
                    <Button href="/">Return Home</Button>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-xvc-black mb-4">Order Confirmed</h1>
                    <p className="text-xl text-xvc-graphite mb-12">
                        Thank you for your order, {order.customerName}! We&apos;ve received your payment and will process your order shortly.
                    </p>

                    {/* Order Details */}
                    <div className="border border-xvc-taupe/30 p-6 mb-8 space-y-6">
                        <div>
                            <h2 className="text-lg text-xvc-black mb-4">Order Details</h2>
                            <p className="text-sm text-xvc-graphite mb-1">
                                <strong>Order ID:</strong> {order.id}
                            </p>
                            <p className="text-sm text-xvc-graphite mb-1">
                                <strong>Status:</strong> {order.status}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-md text-xvc-black mb-3">Items</h3>
                            <div className="space-y-2">
                                {order.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between text-sm text-xvc-graphite"
                                    >
                                        <span>
                                            {item.productName}
                                            {item.shade && ` (${item.shade})`} × {item.quantity}
                                        </span>
                                        <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-xvc-taupe/30 pt-4">
                            <div className="flex justify-between text-lg font-medium text-xvc-black">
                                <span>Total</span>
                                <span>₹{order.total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-md text-xvc-black mb-3">Shipping Address</h3>
                            <p className="text-sm text-xvc-graphite">
                                {order.shippingAddress.line1}
                                {order.shippingAddress.line2 && <br />}
                                {order.shippingAddress.line2}
                                <br />
                                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                                {order.shippingAddress.postalCode}
                                <br />
                                {order.shippingAddress.country}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-xvc-graphite">
                            A confirmation email has been sent to {order.customerEmail}
                        </p>
                        <Button href="/">Continue Shopping</Button>
                    </div>
                </div>
            </section>
        </main>
    );
}

