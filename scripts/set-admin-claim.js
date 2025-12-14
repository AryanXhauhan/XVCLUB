const { getAuth } = require('firebase-admin/auth');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
require('dotenv').config();

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

async function setAdminClaim(uid) {
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
    console.error('❌ Usage: node scripts/set-admin-claim.js <USER_UID>');
    process.exit(1);
}

setAdminClaim(uid);

