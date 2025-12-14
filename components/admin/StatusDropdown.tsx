

'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Order } from '@/lib/types';
import { auth } from '@/lib/firebase/config';

interface StatusDropdownProps {
    order: Order;
    onStatusUpdate: () => void;
}


export default function StatusDropdown({ order, onStatusUpdate }: StatusDropdownProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(order.status);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const statusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const handleStatusUpdate = async (newStatus: string) => {
        if (newStatus === currentStatus) {
            setIsDropdownOpen(false);
            return;
        }

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


            setCurrentStatus(newStatus as any);
            onStatusUpdate();
            setIsDropdownOpen(false);
            toast.success('Order status updated successfully');
        } catch (error: any) {
            console.error('Error updating order status:', error);
            toast.error(error.message || 'Failed to update order status');
        } finally {
            setIsUpdating(false);
        }
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

    const currentStatusLabel = statusOptions.find(option => option.value === currentStatus)?.label || currentStatus;


    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isUpdating}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border smooth-transition disabled:opacity-50 ${getStatusColor(currentStatus)} hover:shadow-sm`}
            >
                {currentStatusLabel}
                {!isUpdating && (
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
                {isUpdating && (
                    <div className="ml-1 w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                )}
            </button>

            {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-36 bg-white border border-xvc-taupe/20 rounded-none shadow-lg">
                    {statusOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleStatusUpdate(option.value)}
                            disabled={isUpdating}
                            className={`block w-full text-left px-3 py-2 text-xs hover:bg-xvc-offwhite smooth-transition disabled:opacity-50 ${
                                option.value === currentStatus ? 'bg-xvc-offwhite text-xvc-black font-medium' : 'text-xvc-graphite'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
