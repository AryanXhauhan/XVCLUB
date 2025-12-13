import { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ui/ProductCard';

export const metadata: Metadata = {
    title: 'Eyes — XVC (Xandre Valente Club)',
    description: 'Precision. All day. XVC eye products made for bold expressions.',
    openGraph: {
        title: 'Eyes — XVC',
        description: 'Precision. All day. XVC eye products made for bold expressions.',
    },
};

async function getProducts(): Promise<Product[]> {
    try {
        const q = query(collection(db, 'products'), where('category', '==', 'eyes'));
        const querySnapshot = await getDocs(q);
        
        const products: Product[] = [];
        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data(),
            } as Product);
        });
        
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

export default async function EyesPage() {
    const products = await getProducts();

    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <h1 className="text-xvc-black mb-4">Eyes</h1>
                <p className="text-xl text-xvc-graphite mb-12 max-w-2xl">
                    Precision. All day. Made for bold expressions.
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

