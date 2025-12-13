import { adminDb } from './admin';
import { products } from '@/lib/data/products';
import { Product } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function seedProducts() {
    console.log('Starting product seeding...');

    try {
        const batch = adminDb.batch();

        for (const product of products) {
            const productRef = adminDb.collection('products').doc(product.id);

            // Convert product to Firestore-compatible format
            const firestoreProduct: Omit<Product, 'id' | 'createdAt'> & { createdAt: any } = {
                name: product.name,
                slug: product.slug,
                category: product.category,
                price: product.price,
                currency: product.currency,
                description: product.description,
                shortDescription: product.shortDescription,
                shades: product.shades,
                images: product.images,
                stock: product.stock,
                createdAt: FieldValue.serverTimestamp(),
            };

            batch.set(productRef, firestoreProduct);
            console.log(`Queued product: ${product.name}`);
        }

        await batch.commit();
        console.log(`Successfully seeded ${products.length} products to Firestore`);
        return { success: true, count: products.length };
    } catch (error) {
        console.error('Error seeding products:', error);
        throw error;
    }
}

// Run seeding if called directly
if (require.main === module) {
    seedProducts()
        .then(() => {
            console.log('Seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}

