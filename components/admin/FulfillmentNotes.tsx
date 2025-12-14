'use client';

import { useState } from 'react';
import { Order } from '@/lib/types';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase/config';

interface FulfillmentNotesProps {
    order: Order;
}

export default function FulfillmentNotes({ order }: FulfillmentNotesProps) {
    const [notes, setNotes] = useState(order.fulfillmentNotes || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSaveNotes = async () => {
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
                body: JSON.stringify({ fulfillmentNotes: notes }),
            });

            if (!response.ok) {
                throw new Error('Failed to update fulfillment notes');
            }

            toast.success('Fulfillment notes updated successfully');
        } catch (error: any) {
            console.error('Error updating fulfillment notes:', error);
            toast.error(error.message || 'Failed to update fulfillment notes');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="bg-white border border-xvc-taupe/20 rounded-none p-6">
            <h2 className="text-xl font-headline text-xvc-black mb-6">Fulfillment Notes</h2>

            <div className="space-y-4">
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about shipping, tracking, or special instructions..."
                    className="w-full h-32 px-3 py-2 border border-xvc-taupe/20 rounded-none text-sm focus:outline-none focus:border-xvc-taupe smooth-transition resize-none"
                    disabled={isUpdating}
                />

                <button
                    onClick={handleSaveNotes}
                    disabled={isUpdating || notes === (order.fulfillmentNotes || '')}
                    className="w-full px-4 py-2 bg-xvc-black text-white text-sm font-medium rounded-none hover:bg-xvc-taupe smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUpdating ? (
                        <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Saving...
                        </div>
                    ) : (
                        'Save Notes'
                    )}
                </button>
            </div>
        </div>
    );
}
