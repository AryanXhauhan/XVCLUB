import { NextRequest, NextResponse } from 'next/server';

import { initAdmin } from '@/lib/firebase-admin';
import { setAdminClaim } from '@/lib/firebase/adminAuth';

/**
 * This endpoint sets the admin custom claim for a user
 * It should be protected and only called after verifying admin credentials
 * 
 * In production, you should add additional security checks here:
 * - Verify the requesting user is already an admin
 * - Or use a secure token/secret
 */

export async function POST(request: NextRequest) {
    const { adminAuth } = initAdmin();

    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'ID token required' },
                { status: 400 }
            );
        }

        // Verify the token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Set admin claim
        await setAdminClaim(uid);

        return NextResponse.json({ success: true, uid });
    } catch (error: any) {
        console.error('Error setting admin claim:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to set admin claim' },
            { status: 500 }
        );
    }
}

