
import { Resend } from 'resend';
import { Order } from '@/lib/types';
import { getOrderConfirmationEmail } from './templates';

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
    // Skip email if Resend is not configured
    if (!resend) {
        console.log('Resend not configured, skipping email for order:', order.id);
        return;
    }

    try {
        const html = getOrderConfirmationEmail(order);

        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'XVC <orders@xvc.com>',
            to: order.customerEmail,
            subject: `Order Confirmation — XVC`,
            html,
        });

        console.log(`Order confirmation email sent to ${order.customerEmail}`);
    } catch (error) {
        console.error('Failed to send order confirmation email:', error);
        // Don't throw - email failure shouldn't break order creation
    }
}

