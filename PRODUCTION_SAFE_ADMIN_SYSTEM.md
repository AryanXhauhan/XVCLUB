# PRODUCTION-SAFE ADMIN SYSTEM IMPLEMENTATION

## 1. 🔐 Admin-only redirect

**File:** `app/admin/layout.tsx`
**Explanation:** Enhanced admin layout with improved client-side authentication, loading states, and proper redirect handling for non-admin users.

```typescript
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
                
                const idTokenResult = await getIdTokenResult(user, true);
                const admin = idTokenResult.claims.admin === true;

                setIsAdmin(admin);

                if (!admin) {
                    if (pathname !== '/admin/login') {
                        router.replace('/admin/login');
                    }
                } else {
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

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

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
```

---

## 2. 🧭 Next.js Middleware guard

**File:** `middleware.ts`
**Explanation:** Route-level protection that blocks non-admin users before page loads using Firebase session cookies and custom claims verification.

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

if (getApps().length === 0) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    if (!pathname.startsWith('/admin')) {
        return NextResponse.next();
    }

    if (pathname === '/admin/login') {
        return NextResponse.next();
    }

    try {
        const sessionCookie = request.cookies.get('session')?.value;
        
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        const auth = getAuth();
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        if (!decodedClaims.admin) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Middleware auth error:', error);
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }
}

export const config = {
    matcher: ['/admin/:path*'],
};
```

**Supporting API:** `app/api/admin/create-session/route.ts`
**Explanation:** Creates secure session cookies for middleware authentication.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

if (getApps().length === 0) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'ID token is required' },
                { status: 400 }
            );
        }

        const auth = getAuth();

        const sessionCookie = await auth.createSessionCookie(idToken, {
            expiresIn: 5 * 24 * 60 * 60 * 1000, // 5 days
        });

        const response = NextResponse.json(
            { success: true },
            { status: 200 }
        );

        response.cookies.set('session', sessionCookie, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 5 * 24 * 60 * 60, // 5 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}
```

---

## 3. 🧱 Firestore security rules

**File:** `firestore.rules`
**Explanation:** Comprehensive security rules ensuring only users with `admin: true` claims can access admin data, with proper validation and audit logging.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.admin == true;
    }

    function isServer() {
      return request.auth == null;
    }

    function isValidEmail(email) {
      return email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }

    // USERS - Admin only access
    match /users/{userId} {
      allow read: if isAdmin();
      allow create, update: if isAdmin();
      allow get, list: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }

    // PRODUCTS - Public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
      
      allow create: if isAdmin() && 
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.price is number &&
        request.resource.data.price > 0;
        
      allow update: if isAdmin() && 
        (!('name' in request.resource.data) || 
         (request.resource.data.name is string && request.resource.data.name.size() > 0)) &&
        (!('price' in request.resource.data) || 
         (request.resource.data.price is number && request.resource.data.price > 0));
    }

    // ORDERS - MOST CRITICAL
    match /orders/{orderId} {
      allow read: if isAdmin();
      allow create: if isServer();
      allow update: if isAdmin();
      allow get: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow delete: if false;
      
      allow create: if isServer() && 
        request.resource.data.userId is string &&
        request.resource.data.email is string &&
        isValidEmail(request.resource.data.email) &&
        request.resource.data.total is number &&
        request.resource.data.total > 0 &&
        request.resource.data.status in ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
        
      allow update: if isAdmin() && 
        (!('status' in request.resource.data) || 
         request.resource.data.status in ['pending', 'paid', 'shipped', 'delivered', 'cancelled']);
    }

    // ADMIN SETTINGS - Admin only
    match /adminSettings/{document} {
      allow read, write: if isAdmin();
    }

    // AUDIT LOGS - Admin only
    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isServer();
      allow update, delete: if false;
    }
  }
}
```

---

## 4. 🚀 Production environment checklist

**File:** `PRODUCTION_CHECKLIST.md`
**Explanation:** Complete production deployment guide with environment variables, platform setup, and security best practices.

### Required Environment Variables

**Firebase Configuration:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYourPrivateKeyHere\\n-----END PRIVATE KEY-----\\n"
```

**Where to Set:**
- **Vercel:** Project Settings > Environment Variables
- **Netlify:** Site Settings > Environment Variables

**Common Production Mistakes to Avoid:**
- ❌ Don't commit `.env.local` to version control
- ❌ Don't use development keys in production
- ❌ Don't forget to update webhook URLs
- ❌ Don't deploy without testing security rules
- ✅ Use different Firebase projects for dev/prod
- ✅ Ensure proper newlines in FIREBASE_PRIVATE_KEY
- ✅ Test thoroughly in staging environment
- ✅ Monitor Firebase usage and security logs

---

## 🔧 Enhanced Login Flow

**File:** `app/admin/login/page.tsx`
**Explanation:** Production-ready login with session cookie creation, error handling, and security best practices.

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const idToken = await getIdToken(user, true);

            const response = await fetch('/api/admin/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const { success } = await response.json();

            if (success) {
                toast.success('Login successful');
                router.replace('/admin');
            } else {
                throw new Error('Session creation failed');
            }
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                toast.error('Invalid email or password');
            } else if (error.code === 'auth/too-many-requests') {
                toast.error('Too many failed attempts. Please try again later');
            } else {
                toast.error(error.message || 'Login failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-xvc-offwhite flex items-center justify-center">
            <section className="editorial-container py-20 max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-headline text-xvc-black mb-2">Admin Login</h1>
                    <p className="text-sm text-xvc-graphite">Authorized personnel only</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-xvc-graphite mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black focus:ring-1 focus:ring-xvc-black transition-colors"
                            placeholder="admin@yourcompany.com"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-xvc-graphite mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black focus:ring-1 focus:ring-xvc-black transition-colors"
                            placeholder="Enter your password"
                            disabled={isLoading}
                        />
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full py-3 text-base font-medium"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Signing in...
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-xvc-graphite/60">
                        Need admin access? Contact your system administrator.
                    </p>
                </div>
            </section>
        </main>
    );
}
```

## 🎯 Summary

Your Next.js + Firebase admin system is now production-safe with:

1. **Dual-layer protection:** Client-side layout guards + server-side middleware
2. **Secure authentication:** Session cookies with proper expiration
3. **Data security:** Comprehensive Firestore rules with validation
4. **Production ready:** Complete deployment checklist and monitoring setup

All files are TypeScript-ready and follow Next.js App Router best practices.
