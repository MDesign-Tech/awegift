import { notificationService } from './service';
import {
  CreateNotificationPayload,
  NotificationResponse,
  NotificationType,
  NotificationScope
} from '../../../type';
import { UserRole } from '@/lib/rbac/roles';
import { emailService } from '@/lib/email/service';
import { fetchUserFromFirestore } from '@/lib/firebase/adminUser';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Get all admin emails
 */
async function getAdminEmails(): Promise<string[]> {
  try {
    const adminsSnapshot = await adminDb.collection('users').where('role', '==', 'admin').get();
    return adminsSnapshot.docs.map(doc => doc.data().email).filter(email => email);
  } catch (error) {
    console.error('Error fetching admin emails:', error);
    return [];
  }
}

/**
 * Create a welcome notification for a new user
 */
export async function createUserWelcomeNotification(
  userId: string,
  email: string,
  name: string
): Promise<NotificationResponse> {
  const result = await notificationService.createNotification(
    {
      recipientId: userId,
      recipientRole: 'user' as UserRole,
      scope: 'personal',
      type: 'WELCOME' as NotificationType,
      title: 'Welcome to Awegift!',
      message: `Hi ${name}, welcome to Awegift! We're excited to have you here. Start exploring our products`,
      url: '/products',
      data: {}
    } 
  );
  return result;
}

/**
 * Create an order placed notification for user
 */
export async function createOrderPlacedNotification(
  userId: string,
  customerEmail: string,
  customerName: string,
  orderId: string,
  totalAmount: number,
  currency: string,
  orderData?: any
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_CREATED' as NotificationType,
    title: 'Order Placed Successfully',
    message: `Hi ${customerName}, your order #${orderId} has been placed successfully. Total: ${currency} ${totalAmount.toFixed(2)}`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);

  // Send email
  if (orderData) {
    try {
      await emailService.sendOrderCreatedEmail(customerEmail, {
        orderId,
        items: orderData.items?.map((item: any) => ({
          name: item.title || item.name,
          quantity: item.quantity,
          price: item.price,
        })) || [],
        total: totalAmount,
        subtotal: orderData.subtotal || totalAmount,
        deliveryFee: orderData.deliveryFee || 0,
        currency,
        deliveryAddress: orderData.orderAddress?.address,
        estimatedDelivery: orderData.estimatedDelivery,
      });
    } catch (emailError) {
      console.error('Failed to send order created email:', emailError);
    }
  }

  return result;
}

// Note: Order status changed notifications should use specific types like ORDER_PAID, ORDER_READY, etc.
// This function is deprecated and should not be used.

/**
 * Create a quotation request notification for admin
 */
export async function createQuotationRequestNotification(
  adminId: string,
  quotationId: string,
  userEmail: string,
  quotationData?: any
): Promise<NotificationResponse> {
  const result = await notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
      scope: 'admin' as NotificationScope,
      type: 'QUOTATION_RECEIVED' as NotificationType,
      title: 'New Quotation Request',
      message: `New quotation request from ${userEmail}. Quotation ID: ${quotationId}`,
      url: `/dashboard/quotes/${quotationId}`,
      data: quotationData,
    }
  );

  // Send email to all admins
  const adminEmails = await getAdminEmails();
  if (adminEmails.length > 0 && quotationData) {
    try {
      await emailService.sendMultipleEmails(
        adminEmails.map(email => ({
          type: 'QUOTATION_RECEIVED',
          to: email,
          quotation: {
            quotationId,
            items: quotationData.products?.map((product: any) => ({
              name: product.name,
              quantity: product.quantity,
              price: product.unitPrice || 0,
            })) || [],
            total: quotationData.finalAmount || 0,
            subtotal: quotationData.subtotal || quotationData.finalAmount || 0,
            currency: 'RWF', // Assuming default currency
            validityPeriod: quotationData.validUntil,
          },
        }))
      );
    } catch (emailError) {
      console.error('Failed to send quotation received emails:', emailError);
    }
  }

  return result;
}

/**
 * Create a quotation sent notification for customer
 */
export async function createQuotationSentNotification(
  userId: string,
  customerEmail: string,
  customerName: string,
  quotationId: string,
  totalAmount: number,
  currency: string,
  quotationData?: any
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'QUOTATION_SENT' as NotificationType,
    title: 'Quotation Response',
    message: `Hi ${customerName}, we've prepared a response to your quotation request #${quotationId}. Total: ${currency} ${totalAmount.toFixed(2)}`,
    url: `/account/quotes/${quotationId}`,
    data: quotationData,
  };
  const result = await notificationService.createNotification(payload);

  // Send email
  if (quotationData) {
    try {
      await emailService.sendQuotationSentEmail(customerEmail, {
        quotationId,
        items: quotationData.products?.map((product: any) => ({
          name: product.name,
          quantity: product.quantity,
          price: product.unitPrice || 0,
        })) || [],
        total: totalAmount,
        subtotal: quotationData.subtotal || totalAmount,
        currency,
        validityPeriod: quotationData.validUntil,
        contactInfo: quotationData.adminNote,
      });
    } catch (emailError) {
      console.error('Failed to send quotation sent email:', emailError);
    }
  }

  return result;
}

/**
 * Create an admin order alert notification
 */
export async function createAdminOrderAlertNotification(
  adminId: string,
  orderId: string,
  customerName: string,
  totalAmount: number,
  currency: string,
  orderData?: any
): Promise<NotificationResponse> {
  const result = await notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
      scope: 'admin' as NotificationScope,
      type: 'ADMIN_NEW_ORDER' as NotificationType,
      title: 'New Order Received',
      message: `New order #${orderId} from ${customerName}. Total: ${currency} ${totalAmount.toFixed(2)}`,
      url: `/dashboard/orders/${orderId}`,
      data: orderData,
    }
  );

  // Send email to all admins
  const adminEmails = await getAdminEmails();
  if (adminEmails.length > 0 && orderData) {
    try {
      await emailService.sendMultipleEmails(
        adminEmails.map(email => ({
          type: 'ADMIN_NEW_ORDER',
          to: email,
          order: {
            orderId,
            items: orderData.items?.map((item: any) => ({
              name: item.title || item.name,
              quantity: item.quantity,
              price: item.price,
            })) || [],
            total: totalAmount,
            subtotal: orderData.subtotal || totalAmount,
            deliveryFee: orderData.deliveryFee || 0,
            currency,
          },
        }))
      );
    } catch (emailError) {
      console.error('Failed to send admin new order emails:', emailError);
    }
  }

  return result;
}

/**
 * Create an order paid notification for user
 */
export async function createOrderPaidNotification(
  userId: string,
  customerEmail: string,
  customerName: string,
  orderId: string,
  totalAmount: number,
  currency: string,
  orderData?: any
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_PAID' as NotificationType,
    title: 'Payment Confirmed',
    message: `Hi ${customerName}, your payment for order #${orderId} has been confirmed. Total: ${currency} ${totalAmount.toFixed(2)}`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);

  // Send email
  if (orderData) {
    try {
      await emailService.sendOrderPaidEmail(customerEmail, {
        orderId,
        items: orderData.items?.map((item: any) => ({
          name: item.title || item.name,
          quantity: item.quantity,
          price: item.price,
        })) || [],
        total: totalAmount,
        subtotal: orderData.subtotal || totalAmount,
        deliveryFee: orderData.deliveryFee || 0,
        currency,
        deliveryAddress: orderData.orderAddress?.address,
        estimatedDelivery: orderData.estimatedDelivery,
      });
    } catch (emailError) {
      console.error('Failed to send order paid email:', emailError);
    }
  }

  return result;
}

/**
 * Create an order ready notification for user
 */
export async function createOrderReadyNotification(
  userId: string,
  customerEmail: string,
  customerName: string,
  orderId: string,
  orderData?: any
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_READY' as NotificationType,
    title: 'Order Ready',
    message: `Hi ${customerName}, your order #${orderId} is now ready for pickup or delivery.`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);

  // Note: No specific email template for order ready, using order paid template as fallback
  if (orderData) {
    try {
      await emailService.sendOrderPaidEmail(customerEmail, {
        orderId,
        items: orderData.items?.map((item: any) => ({
          name: item.title || item.name,
          quantity: item.quantity,
          price: item.price,
        })) || [],
        total: orderData.totalAmount || 0,
        subtotal: orderData.subtotal || orderData.totalAmount || 0,
        deliveryFee: orderData.deliveryFee || 0,
        currency: orderData.currency || 'RWF',
        deliveryAddress: orderData.orderAddress?.address,
        estimatedDelivery: orderData.estimatedDelivery,
      });
    } catch (emailError) {
      console.error('Failed to send order ready email:', emailError);
    }
  }

  return result;
}

/**
 * Create an order completed notification for user
 */
export async function createOrderCompletedNotification(
  userId: string,
  customerEmail: string,
  customerName: string,
  orderId: string,
  orderData?: any
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_COMPLETED' as NotificationType,
    title: 'Order Completed',
    message: `Hi ${customerName}, your order #${orderId} has been successfully completed. Thank you for shopping with us!`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);

  // Note: No specific email template for order completed, using order paid template as fallback
  if (orderData) {
    try {
      await emailService.sendOrderPaidEmail(customerEmail, {
        orderId,
        items: orderData.items?.map((item: any) => ({
          name: item.title || item.name,
          quantity: item.quantity,
          price: item.price,
        })) || [],
        total: orderData.totalAmount || 0,
        subtotal: orderData.subtotal || orderData.totalAmount || 0,
        deliveryFee: orderData.deliveryFee || 0,
        currency: orderData.currency || 'RWF',
        deliveryAddress: orderData.orderAddress?.address,
        estimatedDelivery: orderData.estimatedDelivery,
      });
    } catch (emailError) {
      console.error('Failed to send order completed email:', emailError);
    }
  }

  return result;
}

/**
 * Create an order cancelled notification for user
 */
export async function createOrderCancelledNotification(
  userId: string,
  customerEmail: string,
  customerName: string,
  orderId: string,
  orderData?: any
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_CANCELLED' as NotificationType,
    title: 'Order Cancelled',
    message: `Hi ${customerName}, your order #${orderId} has been cancelled. Please contact support if you have any questions.`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);

  // Note: No specific email template for order cancelled, using order paid template as fallback
  if (orderData) {
    try {
      await emailService.sendOrderPaidEmail(customerEmail, {
        orderId,
        items: orderData.items?.map((item: any) => ({
          name: item.title || item.name,
          quantity: item.quantity,
          price: item.price,
        })) || [],
        total: orderData.totalAmount || 0,
        subtotal: orderData.subtotal || orderData.totalAmount || 0,
        deliveryFee: orderData.deliveryFee || 0,
        currency: orderData.currency || 'RWF',
        deliveryAddress: orderData.orderAddress?.address,
        estimatedDelivery: orderData.estimatedDelivery,
      });
    } catch (emailError) {
      console.error('Failed to send order cancelled email:', emailError);
    }
  }

  return result;
}

/**
 * Create an order failed notification for user
 */
export async function createOrderFailedNotification(
  userId: string,
  customerEmail: string,
  customerName: string,
  orderId: string,
  orderData?: any
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_FAILED' as NotificationType,
    title: 'Payment Failed',
    message: `Hi ${customerName}, your payment for order #${orderId} could not be processed. Please try again or contact support.`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);

  // Note: No specific email template for order failed, using order paid template as fallback
  if (orderData) {
    try {
      await emailService.sendOrderPaidEmail(customerEmail, {
        orderId,
        items: orderData.items?.map((item: any) => ({
          name: item.title || item.name,
          quantity: item.quantity,
          price: item.price,
        })) || [],
        total: orderData.totalAmount || 0,
        subtotal: orderData.subtotal || orderData.totalAmount || 0,
        deliveryFee: orderData.deliveryFee || 0,
        currency: orderData.currency || 'RWF',
        deliveryAddress: orderData.orderAddress?.address,
        estimatedDelivery: orderData.estimatedDelivery,
      });
    } catch (emailError) {
      console.error('Failed to send order failed email:', emailError);
    }
  }

  return result;
}

/**
 * Create an order refunded notification for user
 */
export async function createOrderRefundedNotification(
  userId: string,
  customerEmail: string,
  customerName: string,
  orderId: string,
  refundAmount: number,
  currency: string,
  orderData?: any
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_REFUNDED' as NotificationType,
    title: 'Refund Processed',
    message: `Hi ${customerName}, your refund of ${currency} ${refundAmount.toFixed(2)} for order #${orderId} has been processed.`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);

  // Note: No specific email template for order refunded, using order paid template as fallback
  if (orderData) {
    try {
      await emailService.sendOrderPaidEmail(customerEmail, {
        orderId,
        items: orderData.items?.map((item: any) => ({
          name: item.title || item.name,
          quantity: item.quantity,
          price: item.price,
        })) || [],
        total: orderData.totalAmount || 0,
        subtotal: orderData.subtotal || orderData.totalAmount || 0,
        deliveryFee: orderData.deliveryFee || 0,
        currency: orderData.currency || currency,
        deliveryAddress: orderData.orderAddress?.address,
        estimatedDelivery: orderData.estimatedDelivery,
      });
    } catch (emailError) {
      console.error('Failed to send order refunded email:', emailError);
    }
  }

  return result;
}

/**
 * Create a quotation accepted notification for user
 */
export async function createQuotationAcceptedNotification(
  userId: string,
  quotationId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'QUOTATION_ACCEPTED' as NotificationType,
    title: 'Quotation Accepted',
    message: `Your quotation #${quotationId} has been accepted. We will proceed with your order.`,
    url: `/account/quotes/${quotationId}`,
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create a quotation rejected notification for user
 */
export async function createQuotationRejectedNotification(
  userId: string,
  quotationId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'QUOTATION_REJECTED' as NotificationType,
    title: 'Quotation Update',
    message: `Your quotation #${quotationId} could not be accepted. Please contact us for alternatives.`,
    url: `/account/quotes/${quotationId}`,
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create an email verification notification for user
 */
export async function createEmailVerificationNotification(
  userId: string,
  email: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'EMAIL_VERIFICATION' as NotificationType,
    title: 'Verify Your Email',
    message: `Please verify your email address ${email} to complete your registration.`,
    url: '/account/settings',
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create a password reset notification for user
 */
export async function createPasswordResetNotification(
  userId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'PASSWORD_RESET' as NotificationType,
    title: 'Password Reset',
    message: 'A password reset request has been initiated for your account.',
    url: '/account/settings',
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create an account updated notification for user
 */
export async function createAccountUpdatedNotification(
  userId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ACCOUNT_UPDATED' as NotificationType,
    title: 'Account Updated',
    message: 'Your account information has been successfully updated.',
    url: '/account/settings',
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create a security alert notification for user
 */
export async function createSecurityAlertNotification(
  userId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'SECURITY_ALERT' as NotificationType,
    title: 'Security Alert',
    message: 'Unusual activity detected on your account. Please review your security settings.',
    url: '/account/settings',
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create a new product launch notification for user
 */
export async function createNewProductLaunchNotification(
  userId: string,
  productName: string,
  productId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'NEW_PRODUCT_LAUNCH' as NotificationType,
    title: 'New Product Available',
    message: `Check out our new product: ${productName}`,
    url: `/products/${productId}`,
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create an admin payment failed notification
 */
export async function createAdminPaymentFailedNotification(
  adminId: string,
  orderId: string,
  customerName: string
): Promise<NotificationResponse> {
  return notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
      scope: 'admin' as NotificationScope,
      type: 'ADMIN_PAYMENT_FAILED' as NotificationType,
      title: 'Payment Failed Alert',
      message: `Payment failed for order #${orderId} from ${customerName}. Please investigate.`,
      url: `/dashboard/orders/${orderId}`,
    }
  );
}

/**
 * Create an admin low stock notification
 */
export async function createAdminLowStockNotification(
  adminId: string,
  productName: string,
  productId: string,
  currentStock: number
): Promise<NotificationResponse> {
  return notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
      scope: 'admin' as NotificationScope,
      type: 'ADMIN_LOW_STOCK' as NotificationType,
      title: 'Low Stock Alert',
      message: `${productName} is running low on stock (${currentStock} remaining). Please restock.`,
      url: `/dashboard/products/${productId}`,
    }
  );
}

/**
 * Create an admin order cancelled notification
 */
export async function createAdminOrderCancelledNotification(
  adminId: string,
  orderId: string,
  customerName: string,
  orderData?: any
): Promise<NotificationResponse> {
  const result = await notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
      scope: 'admin' as NotificationScope,
      type: 'ADMIN_ORDER_CANCELLED' as NotificationType,
      title: 'Order Cancelled',
      message: `Order #${orderId} from ${customerName} has been cancelled.`,
      url: `/dashboard/orders/${orderId}`,
      data: orderData,
    }
  );

  // Note: No specific email template for admin order cancelled, using admin new order template as fallback
  const adminEmails = await getAdminEmails();
  if (adminEmails.length > 0 && orderData) {
    try {
      await emailService.sendMultipleEmails(
        adminEmails.map(email => ({
          type: 'ADMIN_NEW_ORDER',
          to: email,
          order: {
            orderId,
            items: orderData.items?.map((item: any) => ({
              name: item.title || item.name,
              quantity: item.quantity,
              price: item.price,
            })) || [],
            total: orderData.totalAmount || 0,
            subtotal: orderData.subtotal || orderData.totalAmount || 0,
            deliveryFee: orderData.deliveryFee || 0,
            currency: orderData.currency || 'RWF',
          },
        }))
      );
    } catch (emailError) {
      console.error('Failed to send admin order cancelled emails:', emailError);
    }
  }

  return result;
}

/**
 * Create an admin new user notification
 */
export async function createAdminNewUserNotification(
  adminId: string,
  userName: string,
  userEmail: string
): Promise<NotificationResponse> {
  return notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
      scope: 'admin' as NotificationScope,
      type: 'ADMIN_NEW_USER' as NotificationType,
      title: 'New User Registered',
      message: `New user ${userName} (${userEmail}) has registered.`,
      url: '/dashboard/users',
    }
  );
}