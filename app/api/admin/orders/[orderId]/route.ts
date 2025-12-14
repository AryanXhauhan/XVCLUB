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
        const body = await request.json();
        const { status, fulfillmentNotes } = body;

        // Validate status if provided
        if (status && !['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Prepare update object
        const updateData: any = {
            updatedAt: FieldValue.serverTimestamp(),
            lastUpdated: FieldValue.serverTimestamp(),
        };

        if (status) {
            updateData.status = status;
        }

        if (fulfillmentNotes !== undefined) {
            updateData.fulfillmentNotes = fulfillmentNotes;
        }

        // Update order
        await adminDb.collection('orders').doc(orderId).update(updateData);

        return NextResponse.json({ success: true, orderId, status, fulfillmentNotes });
    } catch (error: any) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update order' },
            { status: 500 }
        );
    }
}

