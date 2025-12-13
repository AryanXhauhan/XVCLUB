'use client';

import { Suspense } from 'react';
import OrderSuccessClient from './OrderSuccessClient';

// Main page component with Suspense boundary
export default function OrderSuccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-xvc-offwhite">
                <section className="editorial-container py-20 md:py-32">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-8 h-8 border-2 border-xvc-taupe border-t-xvc-black rounded-full animate-spin mx-auto" />
                        <p className="text-xvc-graphite mt-4">Loading...</p>
                    </div>
                </section>
            </main>
        }>
            <OrderSuccessClient />
        </Suspense>
    );
}
