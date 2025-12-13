'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import ShadeSelector from './ShadeSelector';
import AddToCartButton from './AddToCartButton';

interface ProductDetailClientProps {
    product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
    const [selectedShade, setSelectedShade] = useState<string | undefined>(
        product.shades && product.shades.length > 0 ? product.shades[0].name : undefined
    );

    return (
        <>
            {/* Shade Selector (for products with shades) */}
            {product.shades && product.shades.length > 0 && (
                <ShadeSelector
                    shades={product.shades}
                    onSelect={setSelectedShade}
                    selectedShade={selectedShade}
                />
            )}

            {/* Stock Status */}
            {product.stock > 0 ? (
                <p className="text-sm text-xvc-graphite">In Stock</p>
            ) : (
                <p className="text-sm text-xvc-graphite">Out of Stock</p>
            )}

            {/* Add to Cart */}
            <AddToCartButton product={product} selectedShade={selectedShade} />
        </>
    );
}

