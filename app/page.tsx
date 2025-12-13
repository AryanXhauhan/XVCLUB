
import Link from "next/link";
import { Product } from '@/lib/types';
import { products as staticProducts } from '@/lib/data/products';
import ProductCard from '@/components/ui/ProductCard';
import TypingAnimation from '@/components/ui/TypingAnimation';
import HeroModelImage from '@/components/ui/HeroModelImage';

async function getProducts(): Promise<Product[]> {
    // Use static data instead of Firebase during build time
    // This prevents Firebase permission errors during static generation
    return staticProducts.slice(0, 3);
}

export default async function HomePage() {
    const products = await getProducts();

    return (
        <main className="min-h-screen bg-xvc-offwhite">
            {/* Hero Section */}
            <section className="relative editorial-container py-32 md:py-48 lg:py-56 overflow-hidden">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-xvc-nude/15 via-transparent to-xvc-taupe/8 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-xvc-nude/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-xvc-taupe/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Side - Text Content */}
                    <div className="max-w-2xl">
                        <div className="mb-8 fade-in">
                            <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-xvc-graphite font-medium">
                                Xandre Valente Club
                            </span>
                        </div>
                        <h1 className="text-xvc-black mb-10 leading-[0.95] fade-in" style={{ animationDelay: '0.1s' }}>
                            Wear Your<br /><span className="text-xvc-graphite">Power.</span>
                        </h1>
                        <p className="text-xl md:text-2xl lg:text-3xl text-xvc-graphite mb-12 max-w-2xl leading-relaxed fade-in" style={{ animationDelay: '0.2s' }}>
                            A self-expression beauty label made for bold moods, confident looks, and everyday power.
                        </p>
                        <div className="fade-in" style={{ animationDelay: '0.3s' }}>
                            <Link href="#products" className="btn-primary inline-block">
                                Explore XVC
                            </Link>
                        </div>
                    </div>

                    {/* Right Side - Model Image */}
                    <HeroModelImage />
                </div>
            </section>

            {/* Brand Statement */}
            <section className="relative editorial-container py-32 md:py-40 border-t border-xvc-taupe/20">
                <div className="absolute inset-0 bg-gradient-to-r from-xvc-nude/5 via-transparent to-xvc-taupe/5 pointer-events-none" />
                <div className="relative max-w-5xl">
                    <h2 className="text-xvc-black mb-12 text-4xl md:text-6xl lg:text-7xl">This is XVC.</h2>
                    <div className="space-y-8 text-lg md:text-xl lg:text-2xl text-xvc-graphite leading-relaxed">
                        <p className="text-3xl md:text-4xl lg:text-5xl font-headline text-xvc-black leading-tight">XVC is not about covering up.</p>
                        <p className="text-3xl md:text-4xl lg:text-5xl font-headline text-xvc-black leading-tight">It&apos;s about showing up.</p>
                        <p className="mt-12 text-lg md:text-xl lg:text-2xl text-xvc-graphite max-w-3xl leading-relaxed">
                            We create statement beauty essentials designed for confidence, not perfection.
                            Minimal products. Maximum impact.
                        </p>
                    </div>
                </div>
            </section>

            {/* Hero Products Section */}
            <section id="products" className="editorial-container py-32 md:py-40">
                <div className="text-center mb-20">
                    <h2 className="text-xvc-black mb-6 text-4xl md:text-5xl lg:text-6xl">The Essentials</h2>
                    <p className="text-xvc-graphite text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed">
                        Three products. Endless expression.
                    </p>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 lg:gap-20">
                        {products.map((product, index) => (
                            <div key={product.id} className="fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xvc-graphite text-center">Products loading...</p>
                )}
            </section>

            {/* Brand Philosophy */}
            <section className="relative editorial-container py-24 md:py-32 border-t border-xvc-taupe/20">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-xvc-nude/3 to-transparent pointer-events-none" />
                <div className="relative max-w-3xl text-center mx-auto">
                    <div className="text-xl md:text-2xl lg:text-3xl text-xvc-black font-headline leading-relaxed min-h-[120px] md:min-h-[150px] flex items-center justify-center">
                        <TypingAnimation 
                            text="No trends. No noise. Just products made to express who you are — unapologetically."
                            speed={60}
                            pauseDuration={3000}
                            className="text-xvc-black"
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}
