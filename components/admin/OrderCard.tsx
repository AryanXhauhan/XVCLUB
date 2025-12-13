'use client';

import { Order } from '@/lib/types';
import { useState } from 'react';
import { auth } from '@/lib/firebase/config';
import toast from 'react-hot-toast';

interface OrderCardProps {
    order: Order;
    onStatusUpdate: () => void;
}

export default function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(order.status);

    const handleStatusUpdate = async (newStatus: 'paid' | 'shipped' | 'delivered') => {
        if (newStatus === currentStatus) return;

        setIsUpdating(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('Not authenticated');
            }

            const idToken = await user.getIdToken();
            const response = await fetch(`/api/admin/orders/${order.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update order status');
            }

            setCurrentStatus(newStatus);
            toast.success('Order status updated');
            onStatusUpdate();
        } catch (error: any) {
            console.error('Error updating order status:', error);
            toast.error(error.message || 'Failed to update order status');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'text-xvc-graphite';
            case 'shipped':
                return 'text-blue-600';
            case 'delivered':
                return 'text-green-600';
            default:
                return 'text-xvc-graphite';
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="border border-xvc-taupe/30 p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-headline text-xvc-black mb-1">
                        Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-xvc-graphite">
                        {formatDate(order.createdAt)}
                    </p>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(currentStatus)}`}>
                    {currentStatus.toUpperCase()}
                </span>
            </div>

            <div className="border-t border-xvc-taupe/30 pt-4">
                <p className="text-sm text-xvc-graphite mb-1">
                    <strong>Customer:</strong> {order.customerName}
                </p>
                <p className="text-sm text-xvc-graphite mb-1">
                    <strong>Email:</strong> {order.customerEmail}
                </p>
                <p className="text-sm text-xvc-graphite mb-1">
                    <strong>Phone:</strong> {order.customerPhone}
                </p>
            </div>

            <div className="border-t border-xvc-taupe/30 pt-4">
                <h4 className="text-sm font-medium text-xvc-black mb-2">Items</h4>
                <div className="space-y-1">
                    {order.items.map((item, index) => (
                        <p key={index} className="text-sm text-xvc-graphite">
                            {item.productName}
                            {item.shade && ` (${item.shade})`} × {item.quantity} — ₹
                            {(item.price * item.quantity).toLocaleString()}
                        </p>
                    ))}
                </div>
            </div>

            <div className="border-t border-xvc-taupe/30 pt-4">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-xvc-graphite">Total</span>
                    <span className="text-lg font-medium text-xvc-black">
                        ₹{order.total.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="border-t border-xvc-taupe/30 pt-4">
                <h4 className="text-sm font-medium text-xvc-black mb-2">Shipping Address</h4>
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

            {/* Status Update Controls */}
            <div className="border-t border-xvc-taupe/30 pt-4">
                <h4 className="text-sm font-medium text-xvc-black mb-3">Update Status</h4>
                <div className="flex gap-2">
                    {currentStatus === 'paid' && (
                        <button
                            onClick={() => handleStatusUpdate('shipped')}
                            disabled={isUpdating}
                            className="px-4 py-2 text-sm border border-xvc-black text-xvc-black hover:bg-xvc-black hover:text-xvc-offwhite smooth-transition disabled:opacity-50"
                        >
                            Mark as Shipped
                        </button>
                    )}
                    {currentStatus === 'shipped' && (
                        <button
                            onClick={() => handleStatusUpdate('delivered')}
                            disabled={isUpdating}
                            className="px-4 py-2 text-sm border border-xvc-black text-xvc-black hover:bg-xvc-black hover:text-xvc-offwhite smooth-transition disabled:opacity-50"
                        >
                            Mark as Delivered
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

