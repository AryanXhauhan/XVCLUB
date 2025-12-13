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
            // Sign in with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken();

            // Set admin claim via API
            const response = await fetch('/api/admin/set-claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to set admin claim');
            }

            // Refresh token to get updated claims
            await user.getIdToken(true);

            toast.success('Logged in successfully');
            router.push('/admin');
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-xvc-offwhite flex items-center justify-center">
            <section className="editorial-container py-20 max-w-md w-full">
                <h1 className="text-xvc-black mb-8 text-center">Admin Login</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm text-xvc-graphite mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm text-xvc-graphite mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-xvc-taupe/30 bg-xvc-offwhite text-xvc-black focus:outline-none focus:border-xvc-black"
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            </section>
        </main>
    );
}

