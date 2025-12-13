import { Metadata } from 'next';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
    title: 'Terms and Conditions — XVC (Xandre Valente Club)',
    description: 'Terms and Conditions for Xandre Valente Club',
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-xvc-black mb-6">Terms and Conditions</h1>

                    <div className="space-y-6 text-xvc-graphite">
                        <p>By accessing or purchasing from Xandre Valente Club, you agree to the following terms and conditions.</p>

                        <p>All products listed are subject to availability. Prices, descriptions, and availability may change without prior notice.</p>

                        <p>Orders once placed cannot be modified or cancelled after confirmation.</p>

                        <p>Xandre Valente Club reserves the right to refuse service to anyone for any reason at any time.</p>

                        <p>All content, branding, logos, and designs are the intellectual property of Xandre Valente Club and may not be used without permission.</p>

                        <p>Use of our services implies acceptance of these terms.</p>

                        <div className="pt-8">
                            <Button href="/">Continue Shopping</Button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
