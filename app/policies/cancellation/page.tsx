import { Metadata } from 'next';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
    title: 'Cancellation and Refund — XVC (Xandre Valente Club)',
    description: 'Cancellation and Refund Policy for Xandre Valente Club',
};

export default function CancellationPage() {
    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-xvc-black mb-6">Cancellation and Refund Policy</h1>

                    <div className="space-y-6 text-xvc-graphite">
                        <p><strong>Xandre Valente Club follows a strict no-cancellation and no-refund policy.</strong></p>

                        <p>Once an order is placed and confirmed, it cannot be cancelled or refunded.</p>

                        <p>Refunds are only applicable in the rare cases of:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Damaged product received</li>
                            <li>Incorrect product delivered</li>
                        </ul>

                        <p>In such cases, customers must contact us within 48 hours of delivery with valid proof.</p>

                        <p>Approved refunds, if any, will be processed to the original payment method within 5–7 business days.</p>

                        <div className="pt-8">
                            <Button href="/policies/returns">See Return Policy</Button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
