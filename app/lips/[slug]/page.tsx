import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Product } from '@/lib/types';
import AddToCartButton from '@/components/product/AddToCartButton';
import ProductDetailClient from '@/components/product/ProductDetailClient';

interface PageProps {
    params: {
        slug: string;
    };
}

async function getProduct(slug: string): Promise<Product | null> {
    try {
        const q = query(
            collection(db, 'products'),
            where('category', '==', 'lips'),
            where('slug', '==', slug),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }
        
        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
        } as Product;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const product = await getProduct(params.slug);
    
    if (!product) {
        return {
            title: 'Product Not Found — XVC',
        };
    }

    return {
        title: `${product.name} — XVC (Xandre Valente Club)`,
        description: product.shortDescription + ' ' + product.description,
        openGraph: {
            title: product.name,
            description: product.shortDescription,
            images: product.images.length > 0 ? [product.images[0]] : [],
        },
    };
}

export default async function ProductDetailPage({ params }: PageProps) {
    const product = await getProduct(params.slug);

    if (!product) {
        notFound();
    }

    const displayPrice = `₹${product.price.inr.toLocaleString()}`;
    const selectedCurrency = product.currency === 'inr' ? 'INR' : 'USD';
    const availability = product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

    // Product schema JSON-LD
    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        brand: {
            '@type': 'Brand',
            name: 'XVC',
        },
        description: product.description,
        image: product.images.map((img) => 
            img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://xvc.com'}${img}`
        ),
        offers: {
            '@type': 'Offer',
            priceCurrency: selectedCurrency,
            price: product.price.inr.toString(),
            availability: availability,
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <main className="min-h-screen bg-xvc-offwhite">
                <section className="editorial-container py-24 md:py-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20">
                        {/* Product Images */}
                        <div className="space-y-4">
                            {product.images.length > 0 ? (
                                <div className="aspect-square relative bg-gradient-to-br from-xvc-nude/30 to-xvc-taupe/20 overflow-hidden rounded-sm">
                                    <Image
                                        src={product.images[0]}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            ) : (
                                <div className="aspect-square bg-gradient-to-br from-xvc-nude/30 to-xvc-taupe/20 flex items-center justify-center rounded-sm">
                                    <p className="text-xvc-taupe">Product Image</p>
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-xvc-black mb-4 text-4xl md:text-5xl leading-tight">{product.name}</h1>
                                <p className="text-xl md:text-2xl text-xvc-graphite leading-relaxed">{product.shortDescription}</p>
                            </div>

                            {/* Price */}
                            <div className="border-t border-xvc-taupe/20 pt-6">
                                <p className="text-3xl font-semibold text-xvc-black tracking-tight">{displayPrice}</p>
                            </div>

                            {/* Client-side interactive components */}
                            <ProductDetailClient product={product} />

                            {/* Return Policy Callout */}
                            <div className="border-t border-xvc-taupe/30 pt-6">
                                <h2 className="text-lg text-xvc-black mb-2">Return Policy</h2>
                                <p className="text-sm text-xvc-graphite mb-2">
                                    We offer a strict return policy. All sales are final unless the product is defective.
                                </p>
                                <a
                                    href="/policies/returns"
                                    className="text-sm text-xvc-black underline hover:opacity-70"
                                >
                                    Read full return policy →
                                </a>
                            </div>

                            {/* Product Description */}
                            <div className="border-t border-xvc-taupe/30 pt-6">
                                <h2 className="text-lg text-xvc-black mb-4">Why you&apos;ll love it</h2>
                                <p className="text-xvc-graphite leading-relaxed">{product.description}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

