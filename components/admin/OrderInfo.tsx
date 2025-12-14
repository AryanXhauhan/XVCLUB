'use client';

import { Order } from '@/lib/types';
import StatusDropdown from './StatusDropdown';

interface OrderInfoProps {
    order: Order;
}

export default function OrderInfo({ order }: OrderInfoProps) {
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'paid':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'shipped':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'delivered':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'refunded':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="bg-white border border-xvc-taupe/20 rounded-none p-6">
            <h2 className="text-xl font-headline text-xvc-black mb-6">Order Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Details */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                            Order ID
                        </label>
                        <p className="text-sm font-mono text-xvc-black">#{order.id.slice(0, 8)}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                            Razorpay Order ID
                        </label>
                        <p className="text-sm font-mono text-xvc-black">{order.razorpayOrderId}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                            Created
                        </label>
                        <p className="text-sm text-xvc-black">{formatDate(order.createdAt)}</p>
                    </div>

                    {order.lastUpdated && (
                        <div>
                            <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                                Last Updated
                            </label>
                            <p className="text-sm text-xvc-black">{formatDate(order.lastUpdated)}</p>
                        </div>
                    )}
                </div>

                {/* Status Information */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                            Order Status
                        </label>
                        <div className="mt-1">
                            <StatusDropdown
                                order={order}
                                onStatusUpdate={() => {}}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-xvc-graphite uppercase tracking-wider mb-1">
                            Payment Status
                        </label>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
