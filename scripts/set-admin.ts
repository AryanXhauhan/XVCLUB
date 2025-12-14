import dotenv from 'dotenv';
import path from 'path';
import { initAdmin } from '../lib/firebase-admin';

// Load environment variables explicitly from .env.local so this script
// can be run via `npx tsx` outside of Next.js runtime.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error('Usage: npx tsx scripts/set-admin.ts <FIREBASE_UID>');
    process.exitCode = 2;
    return;
  }

  try {
    const { adminAuth } = initAdmin();
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Admin claim set successfully for uid=${uid}`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error setting admin claim:', error?.message || error);
    process.exit(1);
  }
}

void main();

