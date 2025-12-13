import { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
    title: 'Return Policy — XVC (Xandre Valente Club)',
    description: 'XVC return policy. All sales are final unless the product is defective.',
    openGraph: {
        title: 'Return Policy — XVC',
        description: 'XVC return policy. All sales are final unless the product is defective.',
    },
};

export default function ReturnsPolicyPage() {
    return (
        <main className="min-h-screen bg-xvc-offwhite">
            <section className="editorial-container py-20 md:py-32">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-xvc-black mb-8">Return Policy</h1>

                    <div className="space-y-8 text-xvc-graphite">
                        <div>
                            <h2 className="text-xl text-xvc-black mb-4">Our Policy</h2>
                            <p className="leading-relaxed mb-4">
                                At XVC, we stand behind the quality of our products. However, we maintain a strict return policy to ensure the integrity of our brand and products.
                            </p>
                            <p className="leading-relaxed mb-4">
                                <strong className="text-xvc-black">All sales are final unless the product is defective.</strong>
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl text-xvc-black mb-4">Defective Products</h2>
                            <p className="leading-relaxed mb-4">
                                If you receive a product that is defective or damaged, please contact us within 7 days of delivery at{' '}
                                <a href="mailto:support@xvc.com" className="text-xvc-black underline hover:opacity-70">
                                    support@xvc.com
                                </a>
                                {' '}with the following information:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Order number</li>
                                <li>Product name and shade (if applicable)</li>
                                <li>Description of the defect or damage</li>
                                <li>Photos of the defective product</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl text-xvc-black mb-4">Processing Returns</h2>
                            <p className="leading-relaxed mb-4">
                                Once we verify the defect, we will provide you with a return authorization and shipping instructions. We will process your refund or replacement within 14 business days of receiving the returned product.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl text-xvc-black mb-4">Non-Returnable Items</h2>
                            <p className="leading-relaxed mb-4">
                                The following are not eligible for return:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Products that have been opened or used (unless defective)</li>
                                <li>Products purchased more than 7 days ago</li>
                                <li>Products that have been damaged due to misuse or normal wear</li>
                                <li>Products returned without prior authorization</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl text-xvc-black mb-4">Contact Us</h2>
                            <p className="leading-relaxed mb-4">
                                If you have any questions about our return policy, please contact us at{' '}
                                <a href="mailto:support@xvc.com" className="text-xvc-black underline hover:opacity-70">
                                    support@xvc.com
                                </a>
                            </p>
                        </div>

                        <div className="border-t border-xvc-taupe/30 pt-8">
                            <Button href="/">Continue Shopping</Button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

