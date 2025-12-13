import { Product } from '@/lib/types';

// XVC - 3 Hero Products
export const products: Product[] = [
    {
        id: 'matte-liquid-lipstick',
        name: 'XVC Matte Liquid Lipstick',
        slug: 'matte-liquid-lipstick',
        category: 'lips',
        price: {
            inr: 1499,
            usd: 19,
        },
        currency: 'inr',
        shortDescription: 'Bold color. Clean finish.',
        description: 'This is your everyday power move. XVC Matte Liquid Lipstick delivers rich color in a single swipe with a smooth, weightless feel. No overthinking. No touch-ups. Just confidence.',
        shades: [
            { name: 'Nude', code: '#D8CFC4' },
            { name: 'Bold', code: '#8B0000' },
        ],
        images: [
            '/products/lipstick-nude.jpg',
            '/products/lipstick-bold.jpg',
        ],
        stock: 100,
        createdAt: new Date(),
    },
    {
        id: 'waterproof-eyeliner',
        name: 'XVC Waterproof Eyeliner',
        slug: 'waterproof-eyeliner',
        category: 'eyes',
        price: {
            inr: 999,
            usd: 13,
        },
        currency: 'inr',
        shortDescription: 'Precision. All day.',
        description: 'Define your look with confidence. XVC Waterproof Eyeliner glides on smoothly and stays put through every mood. Smudge-proof. Water-resistant. Made for bold expressions.',
        images: [
            '/products/eyeliner-black.jpg',
        ],
        stock: 150,
        createdAt: new Date(),
    },
    {
        id: 'cream-blush',
        name: 'XVC Glow — Cream Blush',
        slug: 'cream-blush',
        category: 'glow',
        price: {
            inr: 1299,
            usd: 17,
        },
        currency: 'inr',
        shortDescription: 'Natural radiance.',
        description: 'Effortless glow in one swipe. XVC Cream Blush blends seamlessly for a fresh, natural flush. Buildable. Lightweight. Designed to enhance, not overpower.',
        images: [
            '/products/blush-glow.jpg',
        ],
        stock: 120,
        createdAt: new Date(),
    },
];
