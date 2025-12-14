'use client';

import { useRouter } from 'next/navigation';
import { Order } from '@/lib/types';
import OrderInfo from './OrderInfo';
import CustomerInfo from './CustomerInfo';
import ProductList from './ProductList';
import PaymentSummary from './PaymentSummary';
import FulfillmentNotes from './FulfillmentNotes';

interface OrderDetailProps {
    order: Order;
}

export default function OrderDetail({ order }: OrderDetailProps) {
    const router = useRouter();

    return (
        <div className="editorial-container py-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push('/admin')}
                    className="text-xvc-graphite hover:text-xvc-black smooth-transition mb-4 inline-flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Orders
                </button>
                <h1 className="text-3xl font-headline text-xvc-black mb-2">
                    Order #{order.id.slice(0, 8)}
                </h1>
                <p className="text-xvc-graphite">
                    Placed on {order.createdAt?.toDate?.()?.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    }) || 'Unknown date'}
                </p>
            </div>

            {/* Order Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Order Info & Customer */}
                <div className="lg:col-span-2 space-y-8">
                    <OrderInfo order={order} />
                    <CustomerInfo order={order} />
                    <ProductList order={order} />
                </div>

                {/* Right Column - Payment & Fulfillment */}
                <div className="space-y-8">
                    <PaymentSummary order={order} />
                    <FulfillmentNotes order={order} />
                </div>
            </div>
        </div>
    );
}
