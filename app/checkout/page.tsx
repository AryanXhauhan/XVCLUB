'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ShippingAddress } from '@/lib/types';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal } = useCart();
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [address, setAddress] = useState<ShippingAddress>({
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
    });

    useEffect(() => {
        setMounted(true);
        if (items.length === 0) {
            router.push('/cart');
        }
    }, [items, router]);

    if (!mounted) {
        return (
            <main className="min-h-screen bg-xvc-offwhite">
                <section className="editorial-container py-20">
                    <p className="text-xvc-graphite">Loading...</p>
                </section>
            </main>
        );
    }

    if (items.length === 0) {
        return null; // Will redirect
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!address.line1.trim() || !address.city.trim() || !address.state.trim() || !address.postalCode.trim()) {
            toast.error('Please fill in all shipping address fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items,
                    customerName,
                    customerEmail,
                    customerPhone,
                    shippingAddress: address,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create checkout session');
            }

            const { key, orderId, amount } = await response.json();

            if (!key || !orderId) {
                throw new Error('Invalid checkout response');
            }

            // Load Razorpay checkout script
            const loadRazorpay = () => new Promise<boolean>((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });

            const ok = await loadRazorpay();
            if (!ok) throw new Error('Failed to load Razorpay SDK');

            const options: any = {
                key,
                amount: amount,
                currency: 'INR',
                order_id: orderId,
                name: 'Xandre Valente Club',
                description: 'XVC Order',
                handler: function (response: any) {
                    // On success, redirect to order-success with identifiers
                    window.location.href = `/order-success?order_id=${response.razorpay_order_id}&payment_id=${response.razorpay_payment_id}`;
                },
                prefill: {
                    name: customerName,
                    email: customerEmail,
                    contact: customerPhone,
                },
            };

            // @ts-ignore
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Something went wrong. Please try again.');
            setIsSubmitting(false);
        }
    };

    const subtotal = getTotal();
    const displaySubtotal = `₹${subtotal.toLocaleString()}`;

    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-24 md:py-32 lg:py-40">
                <h1 className="text-xvc-black mb-16 text-5xl md:text-6xl lg:text-7xl">Checkout</h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Customer Details Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Customer Information */}
                        <div className="space-y-4">
                            <h2 className="text-xl text-xvc-black">Customer Information</h2>
                            
                            <div>
                                <label htmlFor="name" className="block text-sm text-xvc-graphite mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm text-xvc-graphite mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm text-xvc-graphite mb-2">
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    required
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                />
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="space-y-4">
                            <h2 className="text-xl text-xvc-black">Shipping Address</h2>
                            
                            <div>
                                <label htmlFor="line1" className="block text-sm text-xvc-graphite mb-2">
                                    Address Line 1 *
                                </label>
                                <input
                                    type="text"
                                    id="line1"
                                    required
                                    value={address.line1}
                                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                                    className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                />
                            </div>

                            <div>
                                <label htmlFor="line2" className="block text-sm text-xvc-graphite mb-2">
                                    Address Line 2
                                </label>
                                <input
                                    type="text"
                                    id="line2"
                                    value={address.line2}
                                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                                    className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm text-xvc-graphite mb-2">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        required
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="state" className="block text-sm text-xvc-graphite mb-2">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        id="state"
                                        required
                                        value={address.state}
                                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                        className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="postalCode" className="block text-sm text-xvc-graphite mb-2">
                                        Postal Code *
                                    </label>
                                    <input
                                        type="text"
                                        id="postalCode"
                                        required
                                        value={address.postalCode}
                                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                                        className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="country" className="block text-sm text-xvc-graphite mb-2">
                                        Country *
                                    </label>
                                    <input
                                        type="text"
                                        id="country"
                                        required
                                        value={address.country}
                                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                                        className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="border border-xvc-taupe/30 p-6 space-y-6 sticky top-8">
                            <h2 className="text-xl text-xvc-black">Order Summary</h2>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div
                                        key={`${item.productId}-${item.shade || 'default'}-${index}`}
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

                            <div className="border-t border-xvc-taupe/30 pt-4">
                                <div className="flex justify-between text-lg font-medium text-xvc-black">
                                    <span>Total</span>
                                    <span>{displaySubtotal}</span>
                                </div>
                            </div>

                            {/* Return Policy Callout */}
                            <div className="border-t border-xvc-taupe/30 pt-4">
                                <h3 className="text-sm font-medium text-xvc-black mb-2">
                                    Return Policy
                                </h3>
                                <p className="text-xs text-xvc-graphite mb-2">
                                    We offer a strict return policy. All sales are final unless the product is defective.
                                </p>
                                <Link
                                    href="/policies/returns"
                                    className="text-xs text-xvc-black underline hover:opacity-70"
                                >
                                    Read full return policy →
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting ? 'Processing...' : 'Complete Order'}
                            </Button>
                        </div>
                    </div>
                </form>
            </section>
        </main>
    );
}

