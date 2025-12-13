import { Metadata } from 'next';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
    title: 'Privacy Policy — XVC (Xandre Valente Club)',
    description: 'Privacy policy for Xandre Valente Club',
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-xvc-black mb-6">Privacy Policy</h1>

                    <div className="space-y-6 text-xvc-graphite">
                        <p>At Xandre Valente Club, we respect your privacy and are committed to protecting the personal information you share with us.</p>

                        <p>We collect basic information such as name, email address, phone number, shipping address, and payment details solely for order processing, customer support, and service improvement.</p>

                        <p>Payment transactions are securely processed through trusted third-party payment gateways. We do not store your card or payment details.</p>

                        <p>Your personal data is never sold or shared with unauthorized third parties. Information may only be shared with logistics and service partners strictly for order fulfillment.</p>

                        <p>By using our website or services, you consent to our Privacy Policy.</p>

                        <p>For any privacy-related concerns, contact us at: <a href="mailto:aryanofficial40040@gmail.com" className="text-xvc-black underline">aryanofficial40040@gmail.com</a></p>

                        <div className="pt-8">
                            <Button href="/">Continue Shopping</Button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
