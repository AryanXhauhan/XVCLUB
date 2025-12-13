import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shipping and Delivery — XVC (Xandre Valente Club)',
    description: 'Shipping and Delivery Policy for Xandre Valente Club',
};

export default function ShippingPage() {
    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-xvc-black mb-6">Shipping and Delivery</h1>

                    <div className="space-y-6 text-xvc-graphite">
                        <p>We deliver across India via trusted courier partners.</p>

                        <p>Orders are processed within 1–3 business days. Delivery timelines depend on the destination and courier partner.</p>

                        <p>Tracking details will be emailed once the order ships.</p>

                        <p>For any delays or delivery concerns, contact our support team at the Contact page.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
