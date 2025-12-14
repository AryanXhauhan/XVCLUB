'use client';

import { Order } from '@/lib/types';

interface CustomerInfoProps {
    order: Order;
}

export default function CustomerInfo({ order }: CustomerInfoProps) {
    return (
        <div className="bg-white border border-xvc-taupe/20 rounded-none p-6">
            <h2 className="text-xl font-headline text-xvc-black mb-6">Customer Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                            Name
                        </label>
                        <p className="text-sm text-xvc-black">{order.customerName}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                            Email
                        </label>
                        <p className="text-sm text-xvc-black">
                            <a
                                href={`mailto:${order.customerEmail}`}
                                className="text-xvc-black hover:text-xvc-taupe smooth-transition"
                            >
                                {order.customerEmail}
                            </a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                            Phone
                        </label>
                        <p className="text-sm text-xvc-black">
                            <a
                                href={`tel:${order.customerPhone}`}
                                className="text-xvc-black hover:text-xvc-taupe smooth-transition"
                            >
                                {order.customerPhone}
                            </a>
                        </p>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                            Shipping Address
                        </label>
                        <div className="text-sm text-xvc-black space-y-1">
                            <p>{order.shippingAddress.line1}</p>
                            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
