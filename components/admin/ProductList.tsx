'use client';

import { Order } from '@/lib/types';

interface ProductListProps {
    order: Order;
}

export default function ProductList({ order }: ProductListProps) {
    return (
        <div className="bg-white border border-xvc-taupe/20 rounded-none p-6">
            <h2 className="text-xl font-headline text-xvc-black mb-6">Products</h2>

            <div className="space-y-4">
                {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-xvc-taupe/10 last:border-b-0">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-xvc-black mb-1">
                                {item.productName}
                            </h3>
                            {item.shade && (
                                <p className="text-xs text-xvc-graphite">
                                    Shade: {item.shade}
                                </p>
                            )}
                            <p className="text-xs text-xvc-graphite">
                                Quantity: {item.quantity}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-xvc-black">
                                ₹{item.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-xvc-graphite">
                                ₹{(item.price * item.quantity).toLocaleString()} total
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-xvc-taupe/20">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-xvc-black">Total Items</span>
                    <span className="text-sm text-xvc-graphite">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </span>
                </div>
            </div>
        </div>
    );
}
