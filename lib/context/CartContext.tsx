'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OrderItem } from '@/lib/types';

interface CartContextType {
    items: OrderItem[];
    addItem: (item: OrderItem) => void;
    removeItem: (productId: string, shade?: string) => void;
    updateQuantity: (productId: string, quantity: number, shade?: string) => void;
    clearCart: () => void;
    getItemCount: () => number;
    getTotal: () => number; // Client-side preview only - server validates
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'xvc-cart';

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<OrderItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydrate cart from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setItems(parsed);
            }
        } catch (error) {
            console.error('Failed to load cart from localStorage:', error);
        } finally {
            setIsHydrated(true);
        }
    }, []);

    // Persist cart to localStorage whenever items change
    useEffect(() => {
        if (isHydrated) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            } catch (error) {
                console.error('Failed to save cart to localStorage:', error);
            }
        }
    }, [items, isHydrated]);

    const getItemKey = (productId: string, shade?: string) => {
        return shade ? `${productId}-${shade}` : productId;
    };

    const addItem = (item: OrderItem) => {
        setItems((prev) => {
            const itemKey = getItemKey(item.productId, item.shade);
            const existingIndex = prev.findIndex(
                (i) => getItemKey(i.productId, i.shade) === itemKey
            );

            if (existingIndex >= 0) {
                // Update quantity if item already exists
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + item.quantity,
                };
                return updated;
            } else {
                // Add new item
                return [...prev, item];
            }
        });
    };

    const removeItem = (productId: string, shade?: string) => {
        setItems((prev) =>
            prev.filter(
                (item) => getItemKey(item.productId, item.shade) !== getItemKey(productId, shade)
            )
        );
    };

    const updateQuantity = (productId: string, quantity: number, shade?: string) => {
        if (quantity <= 0) {
            removeItem(productId, shade);
            return;
        }

        setItems((prev) =>
            prev.map((item) => {
                if (getItemKey(item.productId, item.shade) === getItemKey(productId, shade)) {
                    return { ...item, quantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const getItemCount = () => {
        return items.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotal = () => {
        // Client-side preview only - server will recalculate
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                getItemCount,
                getTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

