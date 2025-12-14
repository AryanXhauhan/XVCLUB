'use client';

import { Order } from '@/lib/types';
import StatusDropdown from './StatusDropdown';


interface OrderTableRowProps {
    order: Order;
    onRowClick: () => void;
    onStatusUpdate?: () => void;
}


export default function OrderTableRow({ order, onRowClick, onStatusUpdate }: OrderTableRowProps) {
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatProducts = (items: any[]) => {
        if (items.length === 1) {
            return items[0].productName;
        }
        return `${items[0].productName} +${items.length - 1}`;
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
        <div 
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-xvc-offwhite/30 cursor-pointer smooth-transition"
            onClick={onRowClick}
        >
            {/* Order ID */}
            <div className="col-span-2 flex items-center">
                <div>
                    <div className="text-sm font-medium text-xvc-black">
                        #{order.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-xvc-graphite">
                        {order.razorpayOrderId?.slice(0, 12)}...
                    </div>
                </div>
            </div>

            {/* Date */}
            <div className="col-span-2 flex items-center">
                <span className="text-sm text-xvc-graphite">
                    {formatDate(order.createdAt)}
                </span>
            </div>

            {/* Customer */}
            <div className="col-span-2 flex items-center">
                <div>
                    <div className="text-sm text-xvc-black font-medium truncate max-w-32">
                        {order.customerName}
                    </div>
                    <div className="text-xs text-xvc-graphite truncate max-w-32">
                        {order.customerEmail}
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className="col-span-3 flex items-center">
                <div>
                    <div className="text-sm text-xvc-black">
                        {formatProducts(order.items)}
                    </div>
                    <div className="text-xs text-xvc-graphite">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </div>
                </div>
            </div>

            {/* Total */}
            <div className="col-span-1 flex items-center">
                <span className="text-sm font-medium text-xvc-black">
                    ₹{order.total.toLocaleString()}
                </span>
            </div>

            {/* Payment Status */}
            <div className="col-span-1 flex items-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus.toUpperCase()}
                </span>
            </div>


            {/* Order Status */}
            <div className="col-span-1 flex items-center">
                <StatusDropdown 
                    order={order} 
                    onStatusUpdate={onStatusUpdate || (() => {})}
                />
            </div>
        </div>
    );
}
