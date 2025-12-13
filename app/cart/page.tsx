'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';

export default function CartPage() {
    const { items, updateQuantity, removeItem, getTotal, clearCart } = useCart();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <main className="min-h-screen bg-xvc-offwhite">
                <section className="editorial-container py-20">
                    <p className="text-xvc-graphite">Loading cart...</p>
                </section>
            </main>
        );
    }

    const subtotal = getTotal();
    const displaySubtotal = `₹${subtotal.toLocaleString()}`;

    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-24 md:py-32 lg:py-40">
                <h1 className="text-xvc-black mb-16 text-5xl md:text-6xl lg:text-7xl">Cart</h1>

                {items.length === 0 ? (
                    <div className="space-y-8 text-center py-20">
                        <p className="text-2xl md:text-3xl text-xvc-graphite mb-8">Your cart is empty.</p>
                        <Button href="/">Continue Shopping</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-6">
                            {items.map((item, index) => (
                                <div
                                    key={`${item.productId}-${item.shade || 'default'}-${index}`}
                                    className="border-b border-xvc-taupe/30 pb-6"
                                >
                                    <div className="flex gap-6">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-headline text-xvc-black mb-1">
                                                {item.productName}
                                            </h3>
                                            {item.shade && (
                                                <p className="text-sm text-xvc-graphite mb-2">
                                                    Shade: {item.shade}
                                                </p>
                                            )}
                                            <p className="text-lg text-xvc-black">
                                                ₹{item.price.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.productId,
                                                            item.quantity - 1,
                                                            item.shade
                                                        )
                                                    }
                                                    className="w-8 h-8 border border-xvc-taupe hover:border-xvc-black smooth-transition flex items-center justify-center"
                                                >
                                                    −
                                                </button>
                                                <span className="text-xvc-black w-8 text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.productId,
                                                            item.quantity + 1,
                                                            item.shade
                                                        )
                                                    }
                                                    className="w-8 h-8 border border-xvc-taupe hover:border-xvc-black smooth-transition flex items-center justify-center"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeItem(item.productId, item.shade)}
                                                className="text-sm text-xvc-graphite hover:text-xvc-black underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cart Summary */}
                        <div className="lg:col-span-1">
                            <div className="border border-xvc-taupe/30 p-6 space-y-6">
                                <h2 className="text-xl text-xvc-black">Order Summary</h2>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xvc-graphite">
                                        <span>Subtotal</span>
                                        <span>{displaySubtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-xvc-graphite text-sm">
                                        <span>Shipping</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                </div>

                                <div className="border-t border-xvc-taupe/30 pt-4">
                                    <div className="flex justify-between text-lg font-medium text-xvc-black">
                                        <span>Total</span>
                                        <span>{displaySubtotal}</span>
                                    </div>
                                </div>

                                <Button href="/checkout" className="w-full">
                                    Proceed to Checkout
                                </Button>

                                <div className="border-t border-xvc-taupe/30 pt-4">
                                    <p className="text-sm text-xvc-graphite mb-2">
                                        All sales are final unless the product is defective.
                                    </p>
                                    <Link
                                        href="/policies/returns"
                                        className="text-sm text-xvc-black underline hover:opacity-70"
                                    >
                                        Read return policy →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

