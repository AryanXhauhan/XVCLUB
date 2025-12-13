
import { initAdmin } from '@/lib/firebase-admin';

/**
 * Set admin custom claim for a user
 * This should be called server-side after verifying admin credentials
 */

export async function setAdminClaim(uid: string): Promise<void> {
    const { adminAuth } = initAdmin();
    try {
        await adminAuth.setCustomUserClaims(uid, { admin: true });
        console.log(`Admin claim set for user ${uid}`);
    } catch (error) {
        console.error('Error setting admin claim:', error);
        throw error;
    }
}

/**
 * Verify if a user has admin claim
 */

export async function isAdmin(uid: string): Promise<boolean> {
    const { adminAuth } = initAdmin();
    try {
        const user = await adminAuth.getUser(uid);
        return user.customClaims?.admin === true;
    } catch (error) {
        console.error('Error checking admin claim:', error);
        return false;
    }
}

