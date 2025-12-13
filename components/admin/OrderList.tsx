'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { Order } from '@/lib/types';
import OrderCard from './OrderCard';

export default function OrderList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const ordersList: Order[] = [];
            querySnapshot.forEach((doc) => {
                ordersList.push({
                    id: doc.id,
                    ...doc.data(),
                } as Order);
            });

            setOrders(ordersList);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Set up real-time listener
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersList: Order[] = [];
            snapshot.forEach((doc) => {
                ordersList.push({
                    id: doc.id,
                    ...doc.data(),
                } as Order);
            });
            setOrders(ordersList);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <div className="editorial-container py-20">
                <p className="text-xvc-graphite">Loading orders...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="editorial-container py-20">
                <p className="text-xvc-graphite">No orders yet.</p>
            </div>
        );
    }

    return (
        <div className="editorial-container py-20">
            <h1 className="text-xvc-black mb-8">Orders</h1>
            <div className="space-y-6">
                {orders.map((order) => (
                    <OrderCard key={order.id} order={order} onStatusUpdate={fetchOrders} />
                ))}
            </div>
        </div>
    );
}

