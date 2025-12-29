import { notificationService } from './service';
import {
  CreateNotificationPayload,
  NotificationResponse,
  NotificationType,
  NotificationScope
} from '../../../type';
import { UserRole } from '@/lib/rbac/roles';

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
  userEmail: string
): Promise<NotificationResponse> {
  return notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
      scope: 'admin' as NotificationScope,
      type: 'QUOTATION_RECEIVED' as NotificationType,
      title: 'New Quotation Request',
      message: `New quotation request from ${userEmail}. Quotation ID: ${quotationId}`,
      url: `/dashboard/quotes/${quotationId}`,
    }
  );
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
  currency: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'QUOTATION_SENT' as NotificationType,
    title: 'Quotation Response',
    message: `Hi ${customerName}, we've prepared a response to your quotation request #${quotationId}. Total: ${currency} ${totalAmount.toFixed(2)}`,
    url: `/account/quotes/${quotationId}`,
  };
  const result = await notificationService.createNotification(payload);
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
  currency: string
): Promise<NotificationResponse> {
  return notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
      scope: 'admin' as NotificationScope,
      type: 'ADMIN_NEW_ORDER' as NotificationType,
      title: 'New Order Received',
      message: `New order #${orderId} from ${customerName}. Total: ${currency} ${totalAmount.toFixed(2)}`,
      url: `/dashboard/orders/${orderId}`,
    }
  );
}

/**
 * Create an order paid notification for user
 */
export async function createOrderPaidNotification(
  userId: string,
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
    message: `Your payment for order #${orderId} has been confirmed. Total: ${currency} ${totalAmount.toFixed(2)}`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);
  return result;
}

/**
 * Create an order ready notification for user
 */
export async function createOrderReadyNotification(
  userId: string,
  orderId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_READY' as NotificationType,
    title: 'Order Ready',
    message: `Your order #${orderId} is now ready for pickup or delivery.`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  return result;
}

/**
 * Create an order completed notification for user
 */
export async function createOrderCompletedNotification(
  userId: string,
  orderId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_COMPLETED' as NotificationType,
    title: 'Order Completed',
    message: `Your order #${orderId} has been successfully completed. Thank you for shopping with us!`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create an order cancelled notification for user
 */
export async function createOrderCancelledNotification(
  userId: string,
  orderId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_CANCELLED' as NotificationType,
    title: 'Order Cancelled',
    message: `Your order #${orderId} has been cancelled. Please contact support if you have any questions.`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create an order failed notification for user
 */
export async function createOrderFailedNotification(
  userId: string,
  orderId: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_FAILED' as NotificationType,
    title: 'Payment Failed',
    message: `Your payment for order #${orderId} could not be processed. Please try again or contact support.`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  
  return result;
}

/**
 * Create an order refunded notification for user
 */
export async function createOrderRefundedNotification(
  userId: string,
  orderId: string,
  refundAmount: number,
  currency: string
): Promise<NotificationResponse> {
  const payload = {
    recipientId: userId,
    recipientRole: 'user' as UserRole,
    scope: 'personal' as NotificationScope,
    type: 'ORDER_REFUNDED' as NotificationType,
    title: 'Refund Processed',
    message: `Your refund of ${currency} ${refundAmount.toFixed(2)} for order #${orderId} has been processed.`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  
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
  customerName: string
): Promise<NotificationResponse> {
  return notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
      scope: 'admin' as NotificationScope,
      type: 'ADMIN_ORDER_CANCELLED' as NotificationType,
      title: 'Order Cancelled',
      message: `Order #${orderId} from ${customerName} has been cancelled.`,
      url: `/dashboard/orders/${orderId}`,
    }
  );
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