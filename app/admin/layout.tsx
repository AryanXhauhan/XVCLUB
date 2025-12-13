'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                if (pathname !== '/admin/login') {
                    router.push('/admin/login');
                }
                setIsChecking(false);
                return;
            }

            try {
                // Get ID token to check claims
                const idTokenResult = await user.getIdTokenResult();
                const admin = idTokenResult.claims.admin === true;

                if (!admin) {
                    // User is authenticated but not admin
                    router.push('/admin/login');
                    setIsChecking(false);
                    return;
                }

                setIsAdmin(true);
                if (pathname === '/admin/login') {
                    router.push('/admin');
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                router.push('/admin/login');
            } finally {
                setIsChecking(false);
            }
        });

        return () => unsubscribe();
    }, [router, pathname]);

    if (isChecking) {
        return (
            <main className="min-h-screen bg-xvc-offwhite flex items-center justify-center">
                <p className="text-xvc-graphite">Loading...</p>
            </main>
        );
    }

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (!isAdmin) {
        return null; // Will redirect
    }

    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <nav className="editorial-container py-6 border-b border-xvc-taupe/20">
                <div className="flex justify-between items-center">
                    <Link href="/admin" className="text-2xl font-headline text-xvc-black">
                        XVC Admin
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link
                            href="/admin"
                            className="text-sm text-xvc-graphite hover:text-xvc-black smooth-transition"
                        >
                            Orders
                        </Link>
                        <button
                            onClick={async () => {
                                await auth.signOut();
                                router.push('/admin/login');
                            }}
                            className="text-sm text-xvc-graphite hover:text-xvc-black smooth-transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
            {children}
        </main>
    );
}

