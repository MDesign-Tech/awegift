import { EmailType, EmailPayload, OrderEmailData, QuotationEmailData, ProductLounchEmailData } from '@/../type';

/**
 * Email templates for different email types
 */
export class EmailTemplates {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  private static readonly COMPANY_NAME = 'Awegift';
  private static readonly SUPPORT_EMAIL = 'support@awegift.com';

  /**
   * Generate email template based on type and payload
   */
  static generateTemplate(payload: EmailPayload): { subject: string; html: string; text: string } {
    switch (payload.type) {
      case 'WELCOME':
        return this.generateWelcomeEmail(payload);
      case 'EMAIL_VERIFICATION':
        return this.generateEmailVerificationEmail(payload);
      case 'PASSWORD_RESET':
        return this.generatePasswordResetEmail(payload);
      case 'SECURITY_ALERT':
        return this.generateSecurityAlertEmail(payload);
      case 'ORDER_CREATED':
        return this.generateOrderCreatedEmail(payload);
      case 'ORDER_CONFIRMED':
        return this.generateOrderConfirmationEmail(payload);
      case 'ORDER_PAID':
        return this.generateOrderPaidEmail(payload);
      case 'ORDER_READY':
        return this.generateOrderReadyEmail(payload);
      case 'ORDER_COMPLETED':
        return this.generateOrderCompletedEmail(payload);
      case 'ORDER_CANCELLED':
        return this.generateOrderCancelledEmail(payload);
      case 'ORDER_FAILED':
        return this.generateOrderFailedEmail(payload);
      case 'ORDER_REFUNDED':
        return this.generateOrderRefundedEmail(payload);
      case 'QUOTATION_RECEIVED':
        return this.generateQuotationReceivedEmail(payload);
      case 'QUOTATION_SENT':
        return this.generateQuotationSentEmail(payload);
      case 'QUOTATION_ACCEPTED':
        return this.generateQuotationAcceptedEmail(payload);
      case 'QUOTATION_REJECTED':
        return this.generateQuotationRejectedEmail(payload);
      case 'NEW_PRODUCT_LAUNCH':
        return this.generateNewProductLaunchEmail(payload);
      case 'ADMIN_NEW_USER':
        return this.generateAdminNewUserEmail(payload);
      case 'ADMIN_NEW_ORDER':
        return this.generateAdminNewOrderEmail(payload);
      case 'ADMIN_NEW_QUOTATION':
        return this.generateAdminNewQuotationEmail(payload);
      default:
        throw new Error(`Unknown email type: ${payload.type}`);
    }
  }

  private static generateWelcomeEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const name = payload.name || 'Customer';
    const subject = `Welcome to ${this.COMPANY_NAME}, ${name}!`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${this.COMPANY_NAME}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #007bff; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #007bff;">${this.COMPANY_NAME}</h1>
          </div>
          <div class="content">
            <h2 style="color: #333;">Welcome, ${name}!</h2>
            <p>Thank you for joining ${this.COMPANY_NAME}. We're excited to have you as our customer</p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Explore our product catalog</li>
              <li>Set up your wishlist</li>
              <li>Enjoy exclusive member benefits</li>
            </ul>
            <a href="${this.BASE_URL}" class="button">Start Shopping</a>
          </div>
          <div class="footer">
            <p>If you have any questions, reply to this email or contact our support team at <a href="mailto:${this.SUPPORT_EMAIL}">${this.SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to ${this.COMPANY_NAME}, ${name}!

Thank you for joining ${this.COMPANY_NAME}. We're excited to have you as part of our community.

Here's what you can do next:
- Explore our product catalog
- Set up your wishlist
- Enjoy exclusive member benefits

Start shopping: ${this.BASE_URL}

If you have any questions, reply to this email or contact our support team at ${this.SUPPORT_EMAIL}

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateAdminNewUserEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const name = payload.name || 'Admin';
    const subject = `New User Registered - ${this.COMPANY_NAME}`;
    const html = 
    `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registered</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #28a745; }
          .content { padding: 30px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #28a745;">${this.COMPANY_NAME}</h1>
          </div>    
          <div class="content">
            <h2 style="color: #333;">New User Registration</h2>
            <p>Hi ${name},</p>
            <p></p>A new user has just registered on ${this.COMPANY_NAME}. Please review their details in the admin dashboard.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, reply to this email or contact our support team at <a href="mailto:${this.SUPPORT_EMAIL}">${this.SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New User Registration - ${this.COMPANY_NAME}

Hi ${name},

A new user has just registered on ${this.COMPANY_NAME}. Please review their details in the admin dashboard.

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateEmailVerificationEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const name = payload.name || 'User';
    const verificationLink = `${this.BASE_URL}/verify-email?token=some-token`; // TODO: Add actual token logic
    const subject = `Verify your email address - ${this.COMPANY_NAME}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #007bff; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #007bff;">${this.COMPANY_NAME}</h1>
          </div>
          <div class="content">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Hi ${name},</p>
            <p>Thank you for signing up with ${this.COMPANY_NAME}. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationLink}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
            <p>This link will expire in 24 hours for security reasons.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account with ${this.COMPANY_NAME}, please ignore this email.</p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Verify your email address - ${this.COMPANY_NAME}

Hi ${name},

Thank you for signing up with ${this.COMPANY_NAME}. To complete your registration, please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 24 hours for security reasons.

If you didn't create an account with ${this.COMPANY_NAME}, please ignore this email.

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generatePasswordResetEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const name = payload.name || 'User';
    const resetLink = `${this.BASE_URL}/reset-password?token=some-token`; // TODO: Add actual token logic
    const subject = `Reset your password - ${this.COMPANY_NAME}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #dc3545; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #dc3545;">${this.COMPANY_NAME}</h1>
          </div>
          <div class="content">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>For security reasons, this link can only be used once and will expire soon.</p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Reset your password - ${this.COMPANY_NAME}

Hi ${name},

We received a request to reset your password. Click the link below to create a new password:

${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

For security reasons, this link can only be used once and will expire soon.

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateSecurityAlertEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const name = payload.name || 'User';
    const subject = `Security Alert - ${this.COMPANY_NAME}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #ffc107; }
          .content { padding: 30px 0; }
          .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #ffc107; color: #333; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #ffc107;">⚠️ Security Alert</h1>
          </div>
          <div class="content">
            <h2 style="color: #333;">Important Security Notice</h2>
            <p>Hi ${name},</p>
            <div class="alert">
              <p><strong>We detected unusual activity on your account.</strong></p>
              <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
            </div>
            <p>Recommended actions:</p>
            <ul>
              <li>Change your password</li>
              <li>Review your recent login activity</li>
              <li>Enable two-factor authentication if available</li>
            </ul>
            <a href="${this.BASE_URL}/account/settings" class="button">Review Account Security</a>
          </div>
          <div class="footer">
            <p>If you have any questions, contact our support team at <a href="mailto:${this.SUPPORT_EMAIL}">${this.SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Security Alert - ${this.COMPANY_NAME}

Hi ${name},

Important Security Notice

We detected unusual activity on your account.

If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.

Recommended actions:
- Change your password
- Review your recent login activity
- Enable two-factor authentication if available

Review Account Security: ${this.BASE_URL}/account/settings

If you have any questions, contact our support team at ${this.SUPPORT_EMAIL}

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateOrderCreatedEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for order confirmation email');
    }

    const subject = `Order Placed - Order #${order.orderId}`;
    const totalFormatted = this.formatCurrency(order.total, order.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Placed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item-list { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Order Placed</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>Thank you for your order! Your order has been placed successfully and is now pending confirmation.</p>
            
            <div class="order-details">
              <h3>Order Summary</h3>
              <div class="item-list">
                ${order.items.map(item => `
                  <div class="item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${this.formatCurrency(item.price * item.quantity, order.currency)}</span>
                  </div>
                `).join('')}
              </div>
              <div style="border-top: 2px solid #007bff; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${this.formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Shipping:</span>
                  <span>${this.formatCurrency(order.deliveryFee, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Tax:</span>
                  <span>${this.formatCurrency(0, order.currency)}</span>
                </div>
                <div class="total">
                  Total: ${totalFormatted}
                </div>
              </div>
            </div>

            ${order.deliveryAddress ? `
              <h3>Delivery Information</h3>
              <p>${order.deliveryAddress}</p>
            ` : ''}

            ${order.estimatedDelivery ? `
              <h3>Estimated Delivery</h3>
              <p>${order.estimatedDelivery}</p>
            ` : ''}
          </div>
          <div class="footer">
            <p>Track your order in your account dashboard or contact us if you have any questions.</p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Order Confirmation - Order #${order.orderId}

Thank you for your order! We've received your purchase and it's being processed.

Order Summary:
${order.items.map(item => `- ${item.name} x ${item.quantity}: ${this.formatCurrency(item.price * item.quantity, order.currency)}`).join('\n')}

Subtotal: ${this.formatCurrency(order.subtotal, order.currency)}
Delivery Fee: ${this.formatCurrency(order.deliveryFee, order.currency)}
Tax: ${this.formatCurrency(0, order.currency)}
Total: ${totalFormatted}

${order.deliveryAddress ? `Delivery Address: ${order.deliveryAddress}\n` : ''}
${order.estimatedDelivery ? `Estimated Delivery: ${order.estimatedDelivery}\n` : ''}

Track your order in your account dashboard or contact us if you have any questions.

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateOrderPaidEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for order paid email');
    }

    const subject = `Payment Confirmed - Order #${order.orderId}`;
    const totalFormatted = this.formatCurrency(order.total, order.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item-list { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">💳 Payment Confirmed</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>Great news! Your payment has been successfully processed.</p>

            <div class="order-details">
              <h3>Order Summary</h3>
              <div class="item-list">
                ${order.items.map(item => `
                  <div class="item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${this.formatCurrency(item.price * item.quantity, order.currency)}</span>
                  </div>
                `).join('')}
              </div>
              <div style="border-top: 2px solid #28a745; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${this.formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Shipping:</span>
                  <span>${this.formatCurrency(order.deliveryFee, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Tax:</span>
                  <span>${this.formatCurrency(0, order.currency)}</span>
                </div>
                <div class="total">
                  Total: ${totalFormatted}
                </div>
              </div>
            </div>

            ${order.deliveryAddress ? `
              <h3>Delivery Information</h3>
              <p>${order.deliveryAddress}</p>
            ` : ''}

            ${order.estimatedDelivery ? `
              <h3>Estimated Delivery</h3>
              <p>${order.estimatedDelivery}</p>
            ` : ''}
          </div>
          <div class="footer">
            <p>You will receive updates as your order progresses. Track your order in your account dashboard.</p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Payment Confirmed - Order #${order.orderId}

Great news! Your payment has been successfully processed.

Order Summary:
${order.items.map(item => `- ${item.name} x ${item.quantity}: ${this.formatCurrency(item.price * item.quantity, order.currency)}`).join('\n')}

Subtotal: ${this.formatCurrency(order.subtotal, order.currency)}
Delivery Fee: ${this.formatCurrency(order.deliveryFee, order.currency)}
Tax: ${this.formatCurrency(0, order.currency)}
Total: ${totalFormatted}

${order.deliveryAddress ? `Delivery Address: ${order.deliveryAddress}\n` : ''}
${order.estimatedDelivery ? `Estimated Delivery: ${order.estimatedDelivery}\n` : ''}

You will receive updates as your order progresses. Track your order in your account dashboard.

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateOrderReadyEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for order ready email');
    }

    const subject = `Your Order is Ready - Order #${order.orderId}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Ready</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📦 Order Ready</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>Great news! Your order is now ready for pickup or delivery.</p>
            <p>Please arrange for pickup or expect delivery soon.</p>
          </div>
          <div class="footer">
            <p>Track your order in your account dashboard or contact us if you have any questions.</p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Your Order is Ready - Order #${order.orderId}

Great news! Your order is now ready for pickup or delivery.

Please arrange for pickup or expect delivery soon.

Track your order in your account dashboard or contact us if you have any questions.

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateOrderCompletedEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for order completed email');
    }

    const subject = `Order Completed - Order #${order.orderId}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Completed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Order Completed</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>Your order has been successfully completed! Thank you for shopping with us.</p>
            <p>We hope you enjoyed your purchase. Please consider leaving a review or rating for the products.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing ${this.COMPANY_NAME}!</p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Order Completed - Order #${order.orderId}

Your order has been successfully completed! Thank you for shopping with us.

We hope you enjoyed your purchase. Please consider leaving a review or rating for the products.

Thank you for choosing ${this.COMPANY_NAME}!

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateOrderCancelledEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for order cancelled email');
    }

    const subject = `Order Cancelled - Order #${order.orderId}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Cancelled</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">❌ Order Cancelled</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>Your order has been cancelled.</p>
            <p>If you have any questions about this cancellation or need assistance, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>Contact us at <a href="mailto:${this.SUPPORT_EMAIL}">${this.SUPPORT_EMAIL}</a> if you need help.</p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Order Cancelled - Order #${order.orderId}

Your order has been cancelled.

If you have any questions about this cancellation or need assistance, please contact our support team.

Contact us at ${this.SUPPORT_EMAIL} if you need help.

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateOrderFailedEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for order failed email');
    }

    const subject = `Payment Failed - Order #${order.orderId}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">❌ Payment Failed</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>Unfortunately, your payment could not be processed.</p>
            <p>Please check your payment method and try again, or contact your bank/card provider.</p>
            <a href="${this.BASE_URL}/checkout" class="button">Retry Payment</a>
          </div>
          <div class="footer">
            <p>If you continue to experience issues, contact our support team at <a href="mailto:${this.SUPPORT_EMAIL}">${this.SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Payment Failed - Order #${order.orderId}

Unfortunately, your payment could not be processed.

Please check your payment method and try again, or contact your bank/card provider.

Retry Payment: ${this.BASE_URL}/checkout

If you continue to experience issues, contact our support team at ${this.SUPPORT_EMAIL}

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateOrderRefundedEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for order refunded email');
    }

    const subject = `Refund Processed - Order #${order.orderId}`;
    const totalFormatted = this.formatCurrency(order.total, order.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Refund Processed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .refund-amount { font-size: 24px; font-weight: bold; color: #17a2b8; text-align: center; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">💰 Refund Processed</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>Your refund has been successfully processed.</p>
            <div class="refund-amount">Refunded: ${totalFormatted}</div>
            <p>The amount will be credited back to your original payment method within 3-5 business days.</p>
          </div>
          <div class="footer">
            <p>If you have any questions about this refund, contact our support team at <a href="mailto:${this.SUPPORT_EMAIL}">${this.SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Refund Processed - Order #${order.orderId}

Your refund has been successfully processed.

Refunded: ${totalFormatted}

The amount will be credited back to your original payment method within 3-5 business days.

If you have any questions about this refund, contact our support team at ${this.SUPPORT_EMAIL}

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateOrderConfirmationEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for order confirmation email');
    }

    const subject = `Order Confirmed - Order #${order.orderId}`;
    const totalFormatted = this.formatCurrency(order.total, order.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item-list { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Order Confirmed</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>Great news! Your order has been confirmed by our team and is now being processed.</p>

            <div class="order-details">
              <h3>Order Summary</h3>
              <div class="item-list">
                ${order.items.map(item => `
                  <div class="item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${this.formatCurrency(item.price * item.quantity, order.currency)}</span>
                  </div>
                `).join('')}
              </div>
              <div style="border-top: 2px solid #28a745; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${this.formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Shipping:</span>
                  <span>${this.formatCurrency(order.deliveryFee, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Tax:</span>
                  <span>${this.formatCurrency(0, order.currency)}</span>
                </div>
                <div class="total">
                  Total: ${totalFormatted}
                </div>
              </div>
            </div>

            ${order.deliveryAddress ? `
              <h3>Delivery Information</h3>
              <p>${order.deliveryAddress}</p>
            ` : ''}

            ${order.estimatedDelivery ? `
              <h3>Estimated Delivery</h3>
              <p>${order.estimatedDelivery}</p>
            ` : ''}
          </div>
          <div class="footer">
            <p>You will receive updates as your order progresses. Track your order in your account dashboard.</p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Order Confirmed - Order #${order.orderId}

Great news! Your order has been confirmed by our team and is now being processed.

Order Summary:
${order.items.map(item => `- ${item.name} x ${item.quantity}: ${this.formatCurrency(item.price * item.quantity, order.currency)}`).join('\n')}

Subtotal: ${this.formatCurrency(order.subtotal, order.currency)}
Delivery Fee: ${this.formatCurrency(order.deliveryFee, order.currency)}
Tax: ${this.formatCurrency(0, order.currency)}
Total: ${totalFormatted}

${order.deliveryAddress ? `Delivery Address: ${order.deliveryAddress}\n` : ''}
${order.estimatedDelivery ? `Estimated Delivery: ${order.estimatedDelivery}\n` : ''}

You will receive updates as your order progresses. Track your order in your account dashboard.

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateAdminOrderAlertEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for admin order alert email');
    }

    const subject = `New Order Alert - Order #${order.orderId}`;
    const totalFormatted = this.formatCurrency(order.total, order.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item-list { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚨 New Order Alert</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>A new order has been placed and requires your attention.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <div class="item-list">
                ${order.items.map(item => `
                  <div class="item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${this.formatCurrency(item.price * item.quantity, order.currency)}</span>
                  </div>
                `).join('')}
              </div>
              <div style="border-top: 2px solid #dc3545; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${this.formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Shipping:</span>
                  <span>${this.formatCurrency(order.deliveryFee, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Tax:</span>
                  <span>${this.formatCurrency(0, order.currency)}</span>
                </div>
                <div class="total">
                  Total: ${totalFormatted}
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
🚨 New Order Alert - Order #${order.orderId}

A new order has been placed and requires your attention.

Order Details:
${order.items.map(item => `- ${item.name} x ${item.quantity}: ${this.formatCurrency(item.price * item.quantity, order.currency)}`).join('\n')}

Subtotal: ${this.formatCurrency(order.subtotal, order.currency)}
Delivery Fee: ${this.formatCurrency(order.deliveryFee, order.currency)}
Tax: ${this.formatCurrency(0, order.currency)}
Total: ${totalFormatted}

Please review this order in your admin dashboard.
    `;

    return { subject, html, text };
  }

  private static generateQuotationSentEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const quotation = payload.quotation;
    if (!quotation) {
      throw new Error('Quotation data is required for quotation response email');
    }

    const subject = `Quotation Response - Quotation #${quotation.quotationId}`;
    const totalFormatted = this.formatCurrency(quotation.total, quotation.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote Response</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .quote-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item-list { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Quotation Response</h1>
            <p style="margin: 5px 0 0 0;">Quotation #${quotation.quotationId}</p>
          </div>
          <div class="content">
            <p>Here's our response to your quotation request:</p>
            
            <div class="quote-details">
              <h3>Quote Summary</h3>
              <div class="item-list">
                ${quotation.items.map(item => `
                  <div class="item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${this.formatCurrency(item.price * item.quantity, quotation.currency)}</span>
                  </div>
                `).join('')}
              </div>
              <div style="border-top: 2px solid #28a745; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${this.formatCurrency(quotation.subtotal, quotation.currency)}</span>
                </div>
                <div class="total">
                  Total: ${totalFormatted}
                </div>
              </div>
              ${quotation.validityPeriod ? `<p><strong>Validity Period:</strong> ${quotation.validityPeriod}</p>` : ''}
              ${quotation.contactInfo ? `<p><strong>Contact Information:</strong> ${quotation.contactInfo}</p>` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Quotation Response - Quotation #${quotation.quotationId}

Thank you for your . Here's our response to your quotation request:

Quotation Summary:
${quotation.items.map(item => `- ${item.name} x ${item.quantity}: ${this.formatCurrency(item.price * item.quantity, quotation.currency)}`).join('\n')}

Subtotal: ${this.formatCurrency(quotation.subtotal, quotation.currency)}
Total: ${totalFormatted}

${quotation.validityPeriod ? `Validity Period: ${quotation.validityPeriod}\n` : ''}
${quotation.contactInfo ? `Contact Information: ${quotation.contactInfo}\n` : ''}

Please contact us if you have any questions or would like to proceed with this quote.
    `;

    return { subject, html, text };
  }

  private static generateQuotationAcceptedEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const quotation = payload.quotation;
    if (!quotation) {
      throw new Error('Quotation data is required for quotation accepted email');
    }

    const subject = `Quotation Accepted - Quotation #${quotation.quotationId}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation Accepted</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Quotation Accepted</h1>
            <p style="margin: 5px 0 0 0;">Quotation #${quotation.quotationId}</p>
          </div>
          <div class="content">
            <p>Great news! Your quotation has been accepted.</p>
            <p>We will proceed with your order based on the agreed terms. You will receive further updates soon.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, contact our support team at <a href="mailto:${this.SUPPORT_EMAIL}">${this.SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Quotation Accepted - Quotation #${quotation.quotationId}

Great news! Your quotation has been accepted.

We will proceed with your order based on the agreed terms. You will receive further updates soon.

If you have any questions, contact our support team at ${this.SUPPORT_EMAIL}

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateQuotationRejectedEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const quotation = payload.quotation;
    if (!quotation) {
      throw new Error('Quotation data is required for quotation rejected email');
    }

    const subject = `Quotation Update - Quotation #${quotation.quotationId}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation Update</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📋 Quotation Update</h1>
            <p style="margin: 5px 0 0 0;">Quotation #${quotation.quotationId}</p>
          </div>
          <div class="content">
            <p>We regret to inform you that your quotation request could not be accepted at this time.</p>
            <p>Please feel free to submit a new quotation request or contact us for alternative options.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, contact our support team at <a href="mailto:${this.SUPPORT_EMAIL}">${this.SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Quotation Update - Quotation #${quotation.quotationId}

We regret to inform you that your quotation request could not be accepted at this time.

Please feel free to submit a new quotation request or contact us for alternative options.

If you have any questions, contact our support team at ${this.SUPPORT_EMAIL}

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateNewProductLaunchEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const productLaunch = payload.productLaunchInfo;
    if (!productLaunch) {
      throw new Error('Product launch data is required for new product launch email');
    }

    const subject = `New Product Launch: ${productLaunch.productName}`;
    const priceFormatted = this.formatCurrency(productLaunch.price, productLaunch.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Product Launch</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6f42c1; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .product-image { text-align: center; margin: 20px 0; }
          .product-image img { max-width: 100%; height: auto; border-radius: 8px; }
          .price { font-size: 24px; font-weight: bold; color: #6f42c1; text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #6f42c1; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚀 New Product Launch</h1>
          </div>
          <div class="content">
            <h2 style="text-align: center;">${productLaunch.productName}</h2>
            ${productLaunch.image ? `
              <div class="product-image">
                <img src="${productLaunch.image}" alt="${productLaunch.productName}" />
              </div>
            ` : ''}
            <p>${productLaunch.description}</p>
            <div class="price">${priceFormatted}</div>
            <p style="text-align: center;">
              <a href="${productLaunch.detailsUrl}" class="button">View Details</a>
            </p>
          </div>
          <div class="footer">
            <p>Stay tuned for more exciting products!</p>
            <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Product Launch: ${productLaunch.productName}

${productLaunch.description}

Price: ${priceFormatted}

View Details: ${productLaunch.detailsUrl}

Stay tuned for more exciting products!

Best regards,
The ${this.COMPANY_NAME} Team
    `;

    return { subject, html, text };
  }

  private static generateAdminNewOrderEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const order = payload.order;
    if (!order) {
      throw new Error('Order data is required for admin new order email');
    }

    const subject = `New Order Alert - Order #${order.orderId}`;
    const totalFormatted = this.formatCurrency(order.total, order.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item-list { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚨 New Order Alert</h1>
            <p style="margin: 5px 0 0 0;">Order #${order.orderId}</p>
          </div>
          <div class="content">
            <p>A new order has been placed and requires your attention.</p>

            <div class="order-details">
              <h3>Order Details</h3>
              <div class="item-list">
                ${order.items.map(item => `
                  <div class="item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${this.formatCurrency(item.price * item.quantity, order.currency)}</span>
                  </div>
                `).join('')}
              </div>
              <div style="border-top: 2px solid #dc3545; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${this.formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Shipping:</span>
                  <span>${this.formatCurrency(order.deliveryFee, order.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Tax:</span>
                  <span>${this.formatCurrency(0, order.currency)}</span>
                </div>
                <div class="total">
                  Total: ${totalFormatted}
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
🚨 New Order Alert - Order #${order.orderId}

A new order has been placed and requires your attention.

Order Details:
${order.items.map(item => `- ${item.name} x ${item.quantity}: ${this.formatCurrency(item.price * item.quantity, order.currency)}`).join('\n')}

Subtotal: ${this.formatCurrency(order.subtotal, order.currency)}
Delivery Fee: ${this.formatCurrency(order.deliveryFee, order.currency)}
Tax: ${this.formatCurrency(0, order.currency)}
Total: ${totalFormatted}

Please review this order in your admin dashboard.
    `;

    return { subject, html, text };
  }

  private static generateAdminNewQuotationEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const quotation = payload.quotation;
    if (!quotation) {
      throw new Error('Quotation data is required for admin new quotation email');
    }

    const subject = `New Quotation Request - Quotation #${quotation.quotationId}`;
    const totalFormatted = this.formatCurrency(quotation.total, quotation.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Quotation Request</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6f42c1; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .quote-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item-list { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📋 New Quotation Request</h1>
            <p style="margin: 5px 0 0 0;">Quotation #${quotation.quotationId}</p>
          </div>
          <div class="content">
            <p>A new quotation request has been submitted and requires your attention.</p>

            <div class="quote-details">
              <h3>Quotation Details</h3>
              <div class="item-list">
                ${quotation.items.map(item => `
                  <div class="item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${this.formatCurrency(item.price * item.quantity, quotation.currency)}</span>
                  </div>
                `).join('')}
              </div>
              <div style="border-top: 2px solid #6f42c1; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${this.formatCurrency(quotation.subtotal, quotation.currency)}</span>
                </div>
                <div class="total">
                  Total: ${totalFormatted}
                </div>
              </div>
              ${quotation.validityPeriod ? `<p><strong>Requested Validity Period:</strong> ${quotation.validityPeriod}</p>` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
📋 New Quotation Request - Quotation #${quotation.quotationId}

A new quotation request has been submitted and requires your attention.

Quotation Details:
${quotation.items.map(item => `- ${item.name} x ${item.quantity}: ${this.formatCurrency(item.price * item.quantity, quotation.currency)}`).join('\n')}

Subtotal: ${this.formatCurrency(quotation.subtotal, quotation.currency)}
Total: ${totalFormatted}

${quotation.validityPeriod ? `Requested Validity Period: ${quotation.validityPeriod}\n` : ''}

Please review this quotation request in your admin dashboard.
    `;

    return { subject, html, text };
  }


  private static generateQuotationReceivedEmail(payload: EmailPayload): { subject: string; html: string; text: string } {
    const quotation = payload.quotation;
    if (!quotation) {
      throw new Error('Quotation data is required for quotation received email');
    }

    const subject = `New Quotation Request - Quotation #${quotation.quotationId}`;
    const totalFormatted = this.formatCurrency(quotation.total, quotation.currency);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Quotation Request</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6f42c1; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 0; }
          .quote-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item-list { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📋 New Quotation Request</h1>
            <p style="margin: 5px 0 0 0;">Quotation #${quotation.quotationId}</p>
          </div>
          <div class="content">
            <p>A new quotation request has been submitted and requires your attention.</p>
            
            <div class="quote-details">
              <h3>Quotation Details</h3>
              <div class="item-list">
                ${quotation.items.map(item => `
                  <div class="item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${this.formatCurrency(item.price * item.quantity, quotation.currency)}</span>
                  </div>
                `).join('')}
              </div>
              <div style="border-top: 2px solid #6f42c1; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${this.formatCurrency(quotation.subtotal, quotation.currency)}</span>
                </div>
                <div class="total">
                  Total: ${totalFormatted}
                </div>
              </div>
              ${quotation.validityPeriod ? `<p><strong>Requested Validity Period:</strong> ${quotation.validityPeriod}</p>` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
📋 New Quotation Request - Quotation #${quotation.quotationId}

A new quotation request has been submitted and requires your attention.

Quotation Details:
${quotation.items.map(item => `- ${item.name} x ${item.quantity}: ${this.formatCurrency(item.price * item.quantity, quotation.currency)}`).join('\n')}

Subtotal: ${this.formatCurrency(quotation.subtotal, quotation.currency)}
Total: ${totalFormatted}

${quotation.validityPeriod ? `Requested Validity Period: ${quotation.validityPeriod}\n` : ''}

Please review this quotation request in your admin dashboard.
    `;

    return { subject, html, text };
  }

  private static formatCurrency(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'RWF',
      }).format(amount);
    } catch {
      return `${amount} ${currency || 'RWF'}`;
    }
  }
}