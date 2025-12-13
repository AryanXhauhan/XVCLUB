import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-xvc-cream py-12 mt-20">
            <div className="editorial-container">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="font-semibold mb-4">XVC</h3>
                        <p className="text-sm text-xvc-graphite">Quality beauty products handcrafted with care.</p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Customer Service</h4>
                        <ul className="space-y-2 text-sm text-xvc-graphite">
                            <li><Link href="/policies/returns">Return Policy</Link></li>
                            <li><Link href="/policies/cancellation">Cancellation & Refund</Link></li>
                            <li><Link href="/policies/shipping">Shipping & Delivery</Link></li>
                            <li><Link href="/policies/privacy">Privacy Policy</Link></li>
                            <li><Link href="/policies/terms">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Contact</h4>
                        <p className="text-sm text-xvc-graphite">aryanofficial40040@gmail.com</p>
                        <p className="text-sm mt-2"><Link href="/policies/contact">Contact Page</Link></p>
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-xvc-graphite">
                    © {new Date().getFullYear()} Xandre Valente Club. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
