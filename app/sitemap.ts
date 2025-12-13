
import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xvc.com';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/lips`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/eyes`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/glow`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/policies/returns`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    // Dynamic product pages
    try {
        const productsSnapshot = await adminDb.collection('products').get();
        const productPages: MetadataRoute.Sitemap = [];

        productsSnapshot.forEach((doc) => {
            const product = doc.data();
            const category = product.category;
            const slug = product.slug;

            productPages.push({
                url: `${baseUrl}/${category}/${slug}`,
                lastModified: product.updatedAt?.toDate() || new Date(),
                changeFrequency: 'weekly',
                priority: 0.9,
            });
        });

        return [...staticPages, ...productPages];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        // Return static pages even if product fetch fails
        return staticPages;
    }
}

