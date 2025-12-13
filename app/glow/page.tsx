import { Metadata } from 'next';
import { Product } from '@/lib/types';
import { products as staticProducts } from '@/lib/data/products';
import ProductCard from '@/components/ui/ProductCard';

export const metadata: Metadata = {
    title: 'Glow — XVC (Xandre Valente Club)',
    description: 'Natural radiance. Effortless glow. XVC glow products designed to enhance, not overpower.',
    openGraph: {
        title: 'Glow — XVC',
        description: 'Natural radiance. Effortless glow. XVC glow products designed to enhance, not overpower.',
    },
};

async function getProducts(): Promise<Product[]> {
    // Use static data and filter by category
    // This prevents Firebase permission errors during static generation
    return staticProducts.filter(product => product.category === 'glow');
}

export default async function GlowPage() {
    const products = await getProducts();

    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <h1 className="text-xvc-black mb-4">Glow</h1>
                <p className="text-xl text-xvc-graphite mb-12 max-w-2xl">
                    Natural radiance. Effortless glow. Designed to enhance, not overpower.
                </p>

                {products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <p className="text-xvc-graphite">No products available at this time.</p>
                )}
            </section>
        </main>
    );
}
