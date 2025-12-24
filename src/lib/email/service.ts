import { EmailPayload, EmailResponse } from '@/../type';
import { EmailTemplates } from './templates';
import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Email service for sending transactional emails via Gmail SMTP
 */
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Send an email based on the provided payload
   */
  async sendEmail(payload: EmailPayload): Promise<EmailResponse> {
    try {
      // Validate required fields
      this.validatePayload(payload);

      // Generate email template based on type
      const template = EmailTemplates.generateTemplate(payload);

      // Send email via Nodemailer
      const mailOptions = {
        from: `"Awegift" <${process.env.GMAIL_USER}>`,
        to: payload.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };
      const info = await this.transporter.sendMail(mailOptions);

      console.log('Email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send multiple emails in parallel
   */
  async sendMultipleEmails(payloads: EmailPayload[]): Promise<EmailResponse[]> {
    const results = await Promise.allSettled(
      payloads.map(payload => this.sendEmail(payload))
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Failed to send email',
        };
      }
    });
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(to: string, name: string): Promise<EmailResponse> {
    return this.sendEmail({
      type: 'WELCOME',
      to,
      name,
    });
  }

  /**
    * Send admin new user registration email
    */
    async sendAdminNewUserEmail(to: string, name: string): Promise<EmailResponse> {
      return this.sendEmail({
        type: 'ADMIN_NEW_USER',
        to,
        name,
      });
    }

  // /**
  //   * Send email verification email to user
  //   */
  // async sendEmailVerificationEmail(to: string, verificationToken: string): Promise<EmailResponse> {
  //   return this.sendEmail({
  //     type: 'EMAIL_VERIFICATION',
  //     to,
  //     verificationToken,
  //   });
  // }

  /**
    * Send order created email to customer
    */
   async sendOrderCreatedEmail(
     to: string,
     order: {
       orderId: string;
       items: Array<{ name: string; quantity: number; price: number }>;
       total: number;
       subtotal: number;
       deliveryFee: number;
       currency: string;
       deliveryAddress?: string;
       estimatedDelivery?: string;
     }
   ): Promise<EmailResponse> {
     return this.sendEmail({
       type: 'ORDER_CREATED',
       to,
       order,
     });
   }

  /**
    * Send order paid email to customer
    */
   async sendOrderPaidEmail(
     to: string,
     order: {
       orderId: string;
       items: Array<{ name: string; quantity: number; price: number }>;
       total: number;
       subtotal: number;
       deliveryFee: number;
       currency: string;
       deliveryAddress?: string;
       estimatedDelivery?: string;
     }
   ): Promise<EmailResponse> {
     return this.sendEmail({
       type: 'ORDER_PAID',
       to,
       order,
     });
   }

  /**
    * Send admin new order email
    */
   async sendAdminNewOrderEmail(
     to: string,
     order: {
       orderId: string;
       items: Array<{ name: string; quantity: number; price: number }>;
       total: number;
       subtotal: number;
       deliveryFee: number;
       currency: string;
     }
   ): Promise<EmailResponse> {
     return this.sendEmail({
       type: 'ADMIN_NEW_ORDER',
       to,
       order,
     });
   }

  /**
    * Send quotation sent email to customer
    */
   async sendQuotationSentEmail(
     to: string,
     quotation: {
       quotationId: string;
       items: Array<{ name: string; quantity: number; price: number }>;
       total: number;
       subtotal: number;
       currency: string;
       validityPeriod?: string;
       contactInfo?: string;
     }
   ): Promise<EmailResponse> {
     return this.sendEmail({
       type: 'QUOTATION_SENT',
       to,
       quotation,
     });
   }

// Note: Order status changed emails should use specific types like ORDER_PAID, ORDER_READY, etc.
// This method is deprecated and should not be used.

  /**
    * Send quotation received email to admin
    */
   async sendQuotationReceivedEmail(
     to: string,
     quotation: {
       quotationId: string;
       items: Array<{ name: string; quantity: number; price: number }>;
       total: number;
       subtotal: number;
       currency: string;
       validityPeriod?: string;
     }
   ): Promise<EmailResponse> {
     return this.sendEmail({
       type: 'QUOTATION_RECEIVED',
       to,
       quotation,
     });
   }

  /**
   * Validate email payload
   */
  private validatePayload(payload: EmailPayload): void {
    if (!payload.type) {
      throw new Error('Email type is required');
    }

    if (!payload.to) {
      throw new Error('Recipient email is required');
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.to)) {
      throw new Error('Invalid email format');
    }

    // Validate required data for specific email types
    switch (payload.type) {
      case 'ORDER_CREATED':
      case 'ORDER_CONFIRMED':
      case 'ORDER_PAID':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
      case 'ORDER_CANCELLED':
      case 'ORDER_FAILED':
      case 'ORDER_REFUNDED':
      case 'ADMIN_NEW_ORDER':
        if (!payload.order) {
          throw new Error('Order data is required for order-related emails');
        }
        break;
      case 'QUOTATION_SENT':
      case 'QUOTATION_RECEIVED':
      case 'QUOTATION_ACCEPTED':
      case 'QUOTATION_REJECTED':
      case 'ADMIN_NEW_QUOTATION':
        if (!payload.quotation) {
          throw new Error('Quotation data is required for quotation-related emails');
        }
        break;
      case 'NEW_PRODUCT_LAUNCH':
        if (!payload.productLaunchInfo) {
          throw new Error('Product launch data is required for new product launch emails');
        }
        break;
      case 'WELCOME':
      case 'EMAIL_VERIFICATION':
      case 'PASSWORD_RESET':
      case 'SECURITY_ALERT':
        if (!payload.name) {
          throw new Error('Name is required for account-related emails');
        }
        break;
    }
  }

  /**
   * Check if the email service is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.GMAIL_USER &&
      process.env.GMAIL_APP_PASSWORD
    );
  }

  /**
   * Get configuration status for debugging
   */
  static getConfigStatus(): { configured: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!process.env.GMAIL_USER) {
      missing.push('GMAIL_USER');
    }

    if (!process.env.GMAIL_APP_PASSWORD) {
      missing.push('GMAIL_APP_PASSWORD');
    } 
    return {
      configured: missing.length === 0,
      missing,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();