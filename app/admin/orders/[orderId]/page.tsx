'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Order } from '@/lib/types';
import OrderDetail from '@/components/admin/OrderDetail';

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;

            setIsLoading(true);
            setError(null);

            try {
                const orderDoc = await getDoc(doc(db, 'orders', orderId));

                if (!orderDoc.exists()) {
                    setError('Order not found');
                    return;
                }

                const orderData = {
                    id: orderDoc.id,
                    ...orderDoc.data(),
                } as Order;

                setOrder(orderData);
            } catch (err: any) {
                console.error('Error fetching order:', err);
                setError('Failed to load order details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    if (isLoading) {
        return (
            <div className="editorial-container py-20">
                <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-xvc-taupe border-t-xvc-black rounded-full animate-spin"></div>
                    <span className="ml-3 text-xvc-graphite">Loading order details...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="editorial-container py-20">
                <div className="text-center">
                    <h2 className="text-2xl font-headline text-xvc-black mb-4">Error</h2>
                    <p className="text-xvc-graphite mb-6">{error}</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-xvc-black text-white text-sm font-medium rounded-none hover:bg-xvc-taupe smooth-transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="editorial-container py-20">
                <div className="text-center">
                    <h2 className="text-2xl font-headline text-xvc-black mb-4">Order Not Found</h2>
                    <p className="text-xvc-graphite mb-6">The requested order could not be found.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-xvc-black text-white text-sm font-medium rounded-none hover:bg-xvc-taupe smooth-transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return <OrderDetail order={order} />;
}
