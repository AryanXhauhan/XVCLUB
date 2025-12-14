#!/usr/bin/env tsx

import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (getApps().length === 0) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

async function setAdminClaim(uid: string) {
    try {
        const auth = getAuth();
        
        await auth.setCustomUserClaims(uid, { admin: true });
        
        console.log(`✅ Admin claim set for user: ${uid}`);
        console.log('🔄 User must logout and login again for claim to take effect');
        
    } catch (error) {
        console.error('❌ Error setting admin claim:', error);
        process.exit(1);
    }
}

// Get UID from command line argument
const uid = process.argv[2];

if (!uid) {
    console.error('❌ Usage: npm run set-admin <USER_UID>');
    process.exit(1);
}

setAdminClaim(uid);

