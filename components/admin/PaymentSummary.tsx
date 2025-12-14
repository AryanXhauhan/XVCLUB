'use client';

import { Order } from '@/lib/types';

interface PaymentSummaryProps {
    order: Order;
}

export default function PaymentSummary({ order }: PaymentSummaryProps) {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = order.total;

    return (
        <div className="bg-white border border-xvc-taupe/20 rounded-none p-6">
            <h2 className="text-xl font-headline text-xvc-black mb-6">Payment Summary</h2>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-xvc-graphite">Subtotal</span>
                    <span className="text-sm text-xvc-black">₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-xvc-graphite">Shipping</span>
                    <span className="text-sm text-xvc-black">₹{(total - subtotal).toLocaleString()}</span>
                </div>

                <div className="border-t border-xvc-taupe/20 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                        <span className="text-base font-medium text-xvc-black">Total</span>
                        <span className="text-base font-medium text-xvc-black">₹{total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-xvc-taupe/20">
                <div className="text-xs text-xvc-graphite space-y-1">
                    <p>Payment Method: Razorpay</p>
                    <p>Status: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
                </div>
            </div>
        </div>
    );
}
