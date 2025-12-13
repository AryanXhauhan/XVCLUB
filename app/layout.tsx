import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/lib/context/CartContext";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
    title: "XVC (Xandre Valente Club) — Wear Your Power",
    description: "XVC is a bold, minimal beauty brand made for confident self-expression. Three essentials. Endless impact.",
    openGraph: {
        title: "XVC — Wear Your Power",
        description: "Bold, minimal beauty essentials for confident self-expression.",
        type: "website",
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://xvc.com'),
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Organization',
                            name: 'XVC (Xandre Valente Club)',
                            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://xvc.com',
                            logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://xvc.com'}/logo.png`,
                            description: 'XVC is a bold, minimal beauty brand made for confident self-expression.',
                        }),
                    }}
                />
            </head>
            <body>
                <CartProvider>
                    <Navbar />
                    {children}
                    <Footer />
                    <Toaster position="bottom-center" />
                </CartProvider>
            </body>
        </html>
    );
}
