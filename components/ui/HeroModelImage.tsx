'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function HeroModelImage() {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="relative h-[500px] md:h-[600px] lg:h-[700px] fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="relative w-full h-full overflow-hidden rounded-sm shadow-premium bg-gradient-to-br from-xvc-nude/30 to-xvc-taupe/20">
                {!imageError ? (
                    <Image
                        src="/models/hero-model.jpg"
                        alt="XVC Model"
                        fill
                        className="object-cover object-center"
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-xvc-nude/40 via-xvc-taupe/30 to-xvc-nude/40">
                        <div className="text-center px-8">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-xvc-taupe/20 flex items-center justify-center">
                                <svg className="w-12 h-12 text-xvc-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-xvc-graphite text-sm md:text-base mb-1 font-medium">Model Image</p>
                            <p className="text-xvc-taupe text-xs">Add image at /public/models/hero-model.jpg</p>
                        </div>
                    </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-xvc-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
        </div>
    );
}

