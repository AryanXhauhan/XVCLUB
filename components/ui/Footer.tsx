import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="editorial-container py-12 border-t border-xvc-taupe/30 mt-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-sm text-xvc-graphite font-headline">
                    XVC — Wear Your Power.
                </p>

                <nav className="flex gap-8">
                    <Link
                        href="/policies/returns"
                        className="text-sm text-xvc-graphite hover:text-xvc-black smooth-transition"
                    >
                        Return Policy
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
