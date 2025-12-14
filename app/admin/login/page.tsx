

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

            toast.success('Login successful');
            router.replace('/admin');
        } catch (error: any) {
            console.error('Login error:', error);
            
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

