import { Order } from '@/lib/types';

export function getOrderConfirmationEmail(order: Order): string {
    const itemsList = order.items
        .map(
            (item) =>
                `<tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #B9ADA2;">
                        ${item.productName}${item.shade ? ` (${item.shade})` : ''} × ${item.quantity}
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #B9ADA2; text-align: right;">
                        ₹${(item.price * item.quantity).toLocaleString()}
                    </td>
                </tr>`
        )
        .join('');

    const total = `₹${order.total.toLocaleString()}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation — XVC</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #F6F4F1; color: #0B0B0B;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F6F4F1; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; max-width: 600px;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #B9ADA2;">
                            <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 32px; color: #0B0B0B;">
                                XVC
                            </h1>
                            <p style="margin: 8px 0 0; font-size: 12px; color: #3A3A3A; letter-spacing: 0.1em; text-transform: uppercase;">
                                Order Confirmation
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #0B0B0B;">
                                Thank you for your order, ${order.customerName}!
                            </p>
                            
                            <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #3A3A3A;">
                                We've received your order and will process it shortly. Your order details are below.
                            </p>

                            <!-- Order Items -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #0B0B0B; font-size: 14px; color: #0B0B0B;">
                                            Item
                                        </th>
                                        <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #0B0B0B; font-size: 14px; color: #0B0B0B;">
                                            Price
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsList}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td style="padding: 16px 0 8px; border-top: 2px solid #0B0B0B; font-weight: 600; font-size: 16px; color: #0B0B0B;">
                                            Total
                                        </td>
                                        <td style="padding: 16px 0 8px; border-top: 2px solid #0B0B0B; text-align: right; font-weight: 600; font-size: 16px; color: #0B0B0B;">
                                            ${total}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            <!-- Shipping Address -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #F6F4F1;">
                                <h2 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #0B0B0B; text-transform: uppercase; letter-spacing: 0.05em;">
                                    Shipping Address
                                </h2>
                                <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #3A3A3A;">
                                    ${order.shippingAddress.line1}<br>
                                    ${order.shippingAddress.line2 ? `${order.shippingAddress.line2}<br>` : ''}
                                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
                                    ${order.shippingAddress.country}
                                </p>
                            </div>

                            <!-- Footer -->
                            <p style="margin: 30px 0 0; font-size: 12px; line-height: 1.6; color: #3A3A3A; border-top: 1px solid #B9ADA2; padding-top: 20px;">
                                If you have any questions, please contact us at <a href="mailto:support@xvc.com" style="color: #0B0B0B; text-decoration: underline;">support@xvc.com</a>
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Brand Footer -->
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td style="padding: 20px; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #3A3A3A; font-family: 'Playfair Display', serif;">
                                XVC — Wear Your Power.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

