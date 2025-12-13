import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="editorial-container py-6 md:py-8 border-b border-xvc-taupe/10 bg-xvc-offwhite/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <div className="flex justify-between items-center">
                {/* Logo/Brand */}
                <Link href="/" className="text-3xl md:text-4xl font-headline text-xvc-black tracking-tight hover:opacity-80 smooth-transition relative group">
                    XVC
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-xvc-black group-hover:w-full smooth-transition" />
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-8 md:gap-12">
                    <Link href="/cart" className="text-sm md:text-base font-semibold text-xvc-black hover:opacity-70 smooth-transition px-3 py-1.5 rounded-sm hover:bg-xvc-nude/20 smooth-transition">
                        Cart
                    </Link>
                    <Link href="/policies/contact" className="text-sm md:text-base font-medium text-xvc-graphite hover:text-xvc-black smooth-transition relative group">
                        Contact
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-xvc-black group-hover:w-full smooth-transition" />
                    </Link>
                </div>
            </div>
        </nav>
    );
}
