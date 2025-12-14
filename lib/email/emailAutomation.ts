import { Resend } from 'resend';

// Email automation service for marketing and notifications
// Currently not used in core order flow - sendOrderConfirmation.ts handles order emails

export class EmailAutomationService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@xvc.com';
  }

  /**
   * Send welcome email to new customers
   */
  async sendWelcomeEmail(email: string, customerName: string): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `Welcome to XVC Cosmetics, ${customerName}!`,
        html: this.getWelcomeEmailTemplate(customerName)
      });

      if (error) {
        console.error('Welcome email error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Send abandoned cart recovery email
   */
  async sendAbandonedCartEmail(email: string, customerName: string, cartItems: any[]): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Complete your order - Limited time offer inside!',
        html: this.getAbandonedCartTemplate(customerName, cartItems)
      });

      if (error) {
        console.error('Abandoned cart email error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send abandoned cart email:', error);
      return false;
    }
  }

  /**
   * Send post-purchase follow-up email
   */
  async sendPostPurchaseFollowup(email: string, customerName: string, orderId: string): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'How are you loving your XVC products?',
        html: this.getPostPurchaseTemplate(customerName, orderId)
      });

      if (error) {
        console.error('Post-purchase email error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send post-purchase email:', error);
      return false;
    }
  }

  /**
   * Send inventory low alert to admin
   */
  async sendInventoryAlert(productName: string, stockLevel: number): Promise<boolean> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@xvc.com';
      
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [adminEmail],
        subject: 'Inventory Alert: Low Stock Warning',
        html: this.getInventoryAlertTemplate(productName, stockLevel)
      });

      if (error) {
        console.error('Inventory alert email error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send inventory alert:', error);
      return false;
    }
  }

  /**
   * Send promotional email to customers
   */
  async sendPromotionalEmail(recipientEmail: string, subject: string, content: string): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [recipientEmail],
        subject,
        html: content
      });

      if (error) {
        console.error('Promotional email error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send promotional email:', error);
      return false;
    }
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(customerName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A3C;">Welcome to XVC Cosmetics!</h1>
        <p>Dear ${customerName},</p>
        <p>Welcome to the XVC family! We're thrilled to have you join our community of beauty enthusiasts.</p>
        <p>As a new member, you'll be the first to know about our latest products, exclusive offers, and beauty tips.</p>
        <p>Start exploring our luxury cosmetic collection and discover your perfect shades.</p>
        <p style="margin-top: 30px;">With love,<br/>The XVC Team</p>
      </div>
    `;
  }

  /**
   * Abandoned cart email template
   */
  private getAbandonedCartTemplate(customerName: string, cartItems: any[]): string {
    const itemsList = cartItems.map(item => 
      `<li>${item.productName} - Qty: ${item.quantity} - ₹${item.price}</li>`
    ).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A3C;">Complete Your Purchase</h1>
        <p>Dear ${customerName},</p>
        <p>You left some beautiful items in your cart:</p>
        <ul>
          ${itemsList}
        </ul>
        <p><strong>Limited Time Offer:</strong> Get 15% off your first order!</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/cart" style="background-color: #8B5A3C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Your Order</a></p>
        <p style="margin-top: 30px;">With love,<br/>The XVC Team</p>
      </div>
    `;
  }

  /**
   * Post-purchase follow-up template
   */
  private getPostPurchaseTemplate(customerName: string, orderId: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A3C;">How are you loving your XVC products?</h1>
        <p>Dear ${customerName},</p>
        <p>It's been a while since your order (${orderId}) was delivered, and we hope you're absolutely loving your XVC products!</p>
        <p>Your feedback means the world to us. Would you mind leaving a review to help other beauty enthusiasts discover their perfect products?</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/reviews?order=${orderId}" style="background-color: #8B5A3C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Leave a Review</a></p>
        <p style="margin-top: 30px;">With love,<br/>The XVC Team</p>
      </div>
    `;
  }

  /**
   * Inventory alert template
   */
  private getInventoryAlertTemplate(productName: string, stockLevel: number): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">Inventory Alert</h1>
        <p><strong>Product:</strong> ${productName}</p>
        <p><strong>Current Stock:</strong> ${stockLevel} units</p>
        <p><strong>Status:</strong> ${stockLevel < 10 ? 'URGENT - Very Low Stock' : 'Low Stock'}</p>
        <p>Please restock this item to avoid stockouts.</p>
        <p style="margin-top: 30px;">Automated Inventory System</p>
      </div>
    `;
  }
}

// Export singleton instance
export const emailAutomationService = new EmailAutomationService();
