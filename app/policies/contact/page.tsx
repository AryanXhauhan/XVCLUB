import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us — XVC (Xandre Valente Club)',
    description: 'Contact information for Xandre Valente Club',
};

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-xvc-black mb-6">Contact Us</h1>

                    <div className="space-y-6 text-xvc-graphite">
                        <p>
                            For any queries related to orders, shipping, refunds, or general information, reach out to us:
                        </p>

                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Email: aryanofficial40040@gmail.com</li>
                        </ul>

                        <p>Our support team is available Monday to Friday, 10:00 AM — 6:00 PM IST.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
