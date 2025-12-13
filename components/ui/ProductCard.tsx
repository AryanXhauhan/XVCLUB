import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import Button from './Button';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const categoryPath = product.category;
    const productPath = `/${categoryPath}/${product.slug}`;
    const displayPrice = `₹${product.price.inr.toLocaleString()}`;

    return (
        <div className="group smooth-transition">
            {/* Product Image */}
            <Link href={productPath} className="block mb-8">
                <div className="aspect-square bg-gradient-to-br from-xvc-nude/25 to-xvc-taupe/15 overflow-hidden relative rounded-sm shadow-premium group-hover:shadow-premium-hover smooth-transition duration-500">
                    {product.images[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 smooth-transition duration-700"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-xvc-taupe text-sm">Product Image</p>
                        </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 smooth-transition duration-500" />
                    {/* Border effect on hover */}
                    <div className="absolute inset-0 border-2 border-xvc-black/0 group-hover:border-xvc-black/10 smooth-transition duration-500 rounded-sm" />
                </div>
            </Link>

            {/* Product Info */}
            <div className="space-y-5">
                <div>
                    <Link href={productPath}>
                        <h3 className="text-2xl md:text-3xl font-headline text-xvc-black hover:opacity-70 smooth-transition mb-3 leading-tight">
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-sm md:text-base text-xvc-graphite leading-relaxed">
                        {product.shortDescription}
                    </p>
                </div>

                {/* Price */}
                <div className="pt-2 border-t border-xvc-taupe/20">
                    <p className="text-2xl md:text-3xl font-semibold text-xvc-black tracking-tight">{displayPrice}</p>
                </div>

                {/* CTA */}
                <Button href={productPath} variant="secondary" className="w-full text-center mt-6">
                    Discover
                </Button>
            </div>
        </div>
    );
}
