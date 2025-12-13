'use client';

import { useState } from 'react';
import { useCart } from '@/lib/context/CartContext';
import { Product, OrderItem } from '@/lib/types';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface AddToCartButtonProps {
    product: Product;
    selectedShade?: string;
}

export default function AddToCartButton({ product, selectedShade }: AddToCartButtonProps) {
    const { addItem } = useCart();
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = () => {
        if (product.stock <= 0) {
            toast.error('This product is out of stock');
            return;
        }

        // For lipstick, require shade selection
        if (product.shades && product.shades.length > 0 && !selectedShade) {
            toast.error('Please select a shade');
            return;
        }

        setIsAdding(true);

        const orderItem: OrderItem = {
            productId: product.id,
            productName: product.name,
            shade: selectedShade,
            price: product.price.inr, // Client-side price (server validates)
            quantity: 1,
        };

        addItem(orderItem);
        toast.success('Added to cart');
        setIsAdding(false);
    };

    return (
        <Button
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || isAdding}
            className="w-full"
        >
            {product.stock <= 0 ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
        </Button>
    );
}

