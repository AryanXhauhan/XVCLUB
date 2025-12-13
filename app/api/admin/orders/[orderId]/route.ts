import { NextRequest, NextResponse } from 'next/server';

import { initAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteParams {
    params: {
        orderId: string;
    };
}

/**
 * Protected API route - verifies admin custom claim before allowing updates
 */

export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    const { adminDb, adminAuth } = initAdmin();

    try {
        // Get authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - No token provided' },
                { status: 401 }
            );
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify token and check admin claim
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.admin !== true) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        const { orderId } = params;
        const { status } = await request.json();

        // Validate status
        if (!['paid', 'shipped', 'delivered'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Update order
        await adminDb.collection('orders').doc(orderId).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, orderId, status });
    } catch (error: any) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update order' },
            { status: 500 }
        );
    }
}

