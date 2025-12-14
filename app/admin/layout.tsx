
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
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
    const [authUser, setAuthUser] = useState<any>(null);

    useEffect(() => {
        let mounted = true;



        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!mounted) return;

            // TEMPORARY: Skip authentication for demo
            if (pathname === '/admin') {
                setAuthUser({ email: 'demo@xvc.com' });
                setIsAdmin(true);
                setIsChecking(false);
                return;
            }

            if (!user && pathname === '/admin/login') {
                setIsChecking(false);
                return;
            }

            // If no user, redirect to login (except if already on login page)
            if (!user) {
                setAuthUser(null);
                setIsAdmin(false);
                
                if (pathname !== '/admin/login') {
                    router.replace('/admin/login');
                }
                setIsChecking(false);
                return;
            }

            try {
                setAuthUser(user);
                
                // Get fresh ID token with claims
                const idTokenResult = await getIdTokenResult(user, true);
                const admin = idTokenResult.claims.admin === true;

                setIsAdmin(admin);

                // Handle redirect logic
                if (!admin) {
                    // User is authenticated but not admin
                    if (pathname !== '/admin/login') {
                        router.replace('/admin/login');
                    }
                } else {
                    // User is admin
                    if (pathname === '/admin/login') {
                        router.replace('/admin');
                    }
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                if (pathname !== '/admin/login') {
                    router.replace('/admin/login');
                }
                setIsAdmin(false);
            } finally {
                setIsChecking(false);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [router, pathname]);

    // Show loading spinner during auth check
    if (isChecking) {
        return (
            <main className="min-h-screen bg-xvc-offwhite flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-xvc-black mx-auto mb-4"></div>
                    <p className="text-xvc-graphite">Verifying admin access...</p>
                </div>
            </main>
        );
    }

    // Allow login page to render without admin check
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // Don't render content if not admin (will redirect)
    if (!isAdmin || !authUser) {
        return (
            <main className="min-h-screen bg-xvc-offwhite flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-xvc-black mx-auto mb-4"></div>
                    <p className="text-xvc-graphite">Redirecting...</p>
                </div>
            </main>
        );
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
                        <span className="text-xs text-xvc-graphite/60">
                            {authUser?.email}
                        </span>
                        <button
                            onClick={async () => {
                                try {
                                    await auth.signOut();
                                    router.replace('/admin/login');
                                } catch (error) {
                                    console.error('Logout error:', error);
                                }
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

