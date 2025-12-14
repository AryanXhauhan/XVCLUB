import { initAdmin } from '@/lib/firebase-admin';
import { products } from '@/lib/data/products';
import { Product } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

async function seedProductsToFirestore() {
    console.log('🚀 Starting manual product seeding to Firestore...');
    
    try {
        const { adminDb } = initAdmin();
        console.log('✅ Firebase Admin initialized');
        
        const batch = adminDb.batch();
        let successCount = 0;

        for (const product of products) {
            try {
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
                console.log(`📦 Queued product: ${product.name} (${product.id})`);
                successCount++;
            } catch (productError) {
                console.error(`❌ Error queueing product ${product.id}:`, productError);
            }
        }

        // Commit all products in batch
        await batch.commit();
        console.log(`✅ Successfully seeded ${successCount} products to Firestore`);
        
        // Verify products were created
        console.log('🔍 Verifying products in Firestore...');
        const snapshot = await adminDb.collection('products').get();
        console.log(`📊 Total products in Firestore: ${snapshot.size}`);
        
        return { 
            success: true, 
            count: successCount,
            totalInDb: snapshot.size 
        };
        
    } catch (error) {
    console.error('💥 Error seeding products:', error);

    if (error instanceof Error) {
        if (
            error.message.includes('credential') ||
            error.message.includes('auth')
        ) {
            console.error('🔐 Firebase Admin credentials missing. Please check:');
            console.error('   1. FIREBASE_PROJECT_ID in .env.local');
            console.error('   2. FIREBASE_PRIVATE_KEY in .env.local');
            console.error('   3. FIREBASE_CLIENT_EMAIL in .env.local');
        }
    }

    throw error;
}

}

// Execute seeding
if (require.main === module) {
    seedProductsToFirestore()
        .then((result) => {
            console.log('🎉 Seeding completed successfully:', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('💀 Seeding failed:', error);
            process.exit(1);
        });
}

export { seedProductsToFirestore };
