/**
 * Seed products to Firestore
 * 
 * Usage: npx tsx scripts/seed-products.ts
 * 
 * Make sure .env.local has all Firebase Admin credentials set up.
 */

import { seedProducts } from '@/lib/firebase/seed';

async function main() {
    try {
        await seedProducts();
        console.log('✅ Products seeded successfully');
    } catch (error) {
        console.error('❌ Failed to seed products:', error);
        process.exit(1);
    }
}

main();

