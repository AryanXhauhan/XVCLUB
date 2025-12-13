import { Resend } from 'resend';
import { Order } from '@/lib/types';
import { getOrderConfirmationEmail } from './templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
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

