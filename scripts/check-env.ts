

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables explicitly from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Firebase Admin Environment Variables:');
console.log('=====================================');

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

console.log('Project ID:', projectId || 'undefined');
console.log('Client Email:', clientEmail || 'undefined');
console.log('Private Key Exists:', !!privateKey);
