'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Order } from '@/lib/types';
import OrderTableRow from './OrderTableRow';


export default function OrderTable() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        setIsLoading(true);
        
        // TEMPORARY: Show demo data for UI testing
        const demoOrders: Order[] = [
            {
                id: 'demo12345678',
                razorpayOrderId: 'demo_razorpay_123456789',
                customerName: 'Sarah Johnson',
                customerEmail: 'sarah.johnson@email.com',
                customerPhone: '+91 9876543210',
                items: [
                    {
                        productId: 'lipstick-crimson',
                        productName: 'Crimson Silk Lipstick',
                        quantity: 2,
                        price: 1200,
                        shade: 'Crimson'
                    },
                    {
                        productId: 'eyeshadow-nude',
                        productName: 'Nude Palette Eyeshadow',
                        quantity: 1,
                        price: 1800,
                        shade: 'Nude Rose'
                    }
                ],
                total: 4200,
                status: 'paid',
                paymentStatus: 'paid',

                shippingAddress: {
                    line1: '123 Fashion Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400001',
                    country: 'IN'
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'demo87654321',
                razorpayOrderId: 'demo_razorpay_987654321',
                customerName: 'Emma Wilson',
                customerEmail: 'emma.wilson@email.com',
                customerPhone: '+91 9876543211',
                items: [
                    {
                        productId: 'foundation-natural',
                        productName: 'Natural Glow Foundation',
                        quantity: 1,
                        price: 2500,
                        shade: 'Natural'
                    }
                ],
                total: 2500,
                status: 'shipped',
                paymentStatus: 'paid',

                shippingAddress: {
                    line1: '456 Beauty Avenue',
                    city: 'Delhi',
                    state: 'Delhi',
                    postalCode: '110001',
                    country: 'IN'
                },
                createdAt: new Date(Date.now() - 86400000), // Yesterday
                updatedAt: new Date()
            },
            {
                id: 'demo11223344',
                razorpayOrderId: 'demo_razorpay_112233445',
                customerName: 'Priya Sharma',
                customerEmail: 'priya.sharma@email.com',
                customerPhone: '+91 9876543212',
                items: [
                    {
                        productId: 'blush-rose',
                        productName: 'Rose Blush',
                        quantity: 1,
                        price: 800,
                        shade: 'Rose Pink'
                    }
                ],
                total: 800,
                status: 'pending',
                paymentStatus: 'paid',

                shippingAddress: {
                    line1: '789 Glamour Road',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    postalCode: '560001',
                    country: 'IN'
                },
                createdAt: new Date(Date.now() - 172800000), // 2 days ago
                updatedAt: new Date()
            }
        ];
        
        // Simulate loading delay
        setTimeout(() => {
            setOrders(demoOrders);
            setIsLoading(false);
        }, 1000);
    }, []);

    const handleRowClick = (orderId: string) => {
        router.push(`/admin/orders/${orderId}`);
    };

    if (isLoading) {
        return (
            <div className="editorial-container py-20">
                <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-xvc-taupe border-t-xvc-black rounded-full animate-spin"></div>
                    <span className="ml-3 text-xvc-graphite">Loading orders...</span>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="editorial-container py-20">
                <div className="text-center">
                    <h2 className="text-2xl font-headline text-xvc-black mb-4">No Orders Yet</h2>

                    <p className="text-xvc-graphite">When customers place orders, they&apos;ll appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="editorial-container py-20">
            <div className="mb-8">
                <h1 className="text-4xl font-headline text-xvc-black mb-2">Orders</h1>
                <p className="text-xvc-graphite">Manage your dropshipping orders</p>
            </div>

            <div className="bg-white border border-xvc-taupe/20 rounded-none overflow-hidden">
                {/* Table Header */}
                <div className="bg-xvc-offwhite border-b border-xvc-taupe/20">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium text-xvc-graphite uppercase tracking-wider">
                        <div className="col-span-2">Order ID</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2">Customer</div>
                        <div className="col-span-3">Products</div>
                        <div className="col-span-1">Total</div>
                        <div className="col-span-1">Payment</div>
                        <div className="col-span-1">Status</div>
                    </div>
                </div>


                {/* Table Body */}
                <div className="divide-y divide-xvc-taupe/10">
                    {orders.map((order) => (
                        <OrderTableRow
                            key={order.id}
                            order={order}
                            onRowClick={() => handleRowClick(order.id)}
                            onStatusUpdate={() => {}} // Status updates are handled by the dropdown component itself
                        />
                    ))}
                </div>
            </div>

            <div className="mt-6 text-xs text-xvc-graphite">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
            </div>
        </div>
    );
}
