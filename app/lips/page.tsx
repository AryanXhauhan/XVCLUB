import { Metadata } from 'next';
import { Product } from '@/lib/types';
import { products as staticProducts } from '@/lib/data/products';
import ProductCard from '@/components/ui/ProductCard';

export const metadata: Metadata = {
    title: 'Lips — XVC (Xandre Valente Club)',
    description: 'Bold color. Clean finish. XVC lip products designed for confident self-expression.',
    openGraph: {
        title: 'Lips — XVC',
        description: 'Bold color. Clean finish. XVC lip products designed for confident self-expression.',
    },
};

async function getProducts(): Promise<Product[]> {
    // Use static data and filter by category
    // This prevents Firebase permission errors during static generation
    return staticProducts.filter(product => product.category === 'lips');
}

export default async function LipsPage() {
    const products = await getProducts();

    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <h1 className="text-xvc-black mb-4">Lips</h1>
                <p className="text-xl text-xvc-graphite mb-12 max-w-2xl">
                    Bold color. Clean finish. Designed for confidence.
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
