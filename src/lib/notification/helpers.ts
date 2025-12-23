import { notificationService } from './service';
import {
  CreateNotificationPayload,
  NotificationResponse,
  NotificationType
} from '../../../type';
import { UserRole } from '@/lib/rbac/roles';
import { emailService } from '@/lib/email/service';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Send notification email based on notification type
 */
async function sendNotificationEmail(payload: CreateNotificationPayload, userEmail?: string, userName?: string): Promise<void> {
  if (!userEmail) return;

  const emailTypeMap: Record<string, string> = {
    'QUOTATION_RECEIVED': 'QUOTATION_RECEIVED',
    'QUOTATION_SENT': 'QUOTATION_SENT',
    'QUOTATION_ACCEPTED': 'QUOTATION_ACCEPTED',
    'QUOTATION_REJECTED': 'QUOTATION_REJECTED',
    'ORDER_CREATED': 'ORDER_CREATED',
    'ORDER_PAID': 'ORDER_PAID',
    'ORDER_READY': 'ORDER_READY',
    'ORDER_COMPLETED': 'ORDER_COMPLETED',
    'ORDER_CANCELLED': 'ORDER_CANCELLED',
    'ORDER_FAILED': 'ORDER_FAILED',
    'ORDER_REFUNDED': 'ORDER_REFUNDED',
    'EMAIL_VERIFICATION': 'EMAIL_VERIFICATION',
    'PASSWORD_RESET': 'PASSWORD_RESET',
    'ACCOUNT_UPDATED': 'ACCOUNT_UPDATED',
    'SECURITY_ALERT': 'SECURITY_ALERT',
    'NEW_PRODUCT_LAUNCH': 'NEW_PRODUCT_LAUNCH',
  };
  const emailType = emailTypeMap[payload.type];
  if (!emailType) return;

  try {
    const emailPayload: any = {
      type: emailType,
      to: userEmail,
    };

    if (payload.type === 'EMAIL_VERIFICATION' || payload.type === 'PASSWORD_RESET' || payload.type === 'SECURITY_ALERT') {
      emailPayload.name = userName;
    } else if (payload.data) {
      if (payload.type.startsWith('ORDER_') || payload.type === 'ADMIN_NEW_ORDER') {
        emailPayload.order = payload.data;
      } else if (payload.type.startsWith('QUOTATION_') || payload.type === 'ADMIN_NEW_QUOTATION') {
        emailPayload.quotation = payload.data;
      } else if (payload.type === 'NEW_PRODUCT_LAUNCH') {
        emailPayload.productLaunchInfo = payload.data;
      }
    }

    await emailService.sendEmail(emailPayload);
  } catch (error) {
    console.error('Error sending notification email:', error);
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
      type: 'WELCOME' as NotificationType,
      title: 'Welcome to Awegift!',
      message: `Hi ${name}, welcome to Awegift! We're excited to have you here. Start exploring our products`,
      url: '/products',
    }
  );
  if (result.success) {
    await sendNotificationEmail({
      recipientId: userId,
      recipientRole: 'user' as UserRole,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome to Awegift!',
      message: `Hi ${name}, welcome to Awegift! We're excited to have you here. Start exploring our products`,
      url: '/products',
    }, email, name);
  }
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
    type: 'ORDER_CREATED' as NotificationType,
    title: 'Order Placed Successfully',
    message: `Hi ${customerName}, your order #${orderId} has been placed successfully. Total: ${currency} ${totalAmount.toFixed(2)}`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    await sendNotificationEmail(payload, customerEmail, customerName);
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
  userEmail: string
): Promise<NotificationResponse> {
  return notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
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
    type: 'QUOTATION_SENT' as NotificationType,
    title: 'Quotation Response',
    message: `Hi ${customerName}, we've prepared a response to your quotation request #${quotationId}. Total: ${currency} ${totalAmount.toFixed(2)}`,
    url: `/account/quotes/${quotationId}`,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    await sendNotificationEmail(payload, customerEmail, customerName);
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
  currency: string
): Promise<NotificationResponse> {
  return notificationService.createNotification(
    {
      recipientId: adminId,
      recipientRole: 'admin' as UserRole,
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
    type: 'ORDER_PAID' as NotificationType,
    title: 'Payment Confirmed',
    message: `Your payment for order #${orderId} has been confirmed. Total: ${currency} ${totalAmount.toFixed(2)}`,
    url: `/account/orders/${orderId}`,
    data: orderData,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'ORDER_READY' as NotificationType,
    title: 'Order Ready',
    message: `Your order #${orderId} is now ready for pickup or delivery.`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'ORDER_COMPLETED' as NotificationType,
    title: 'Order Completed',
    message: `Your order #${orderId} has been successfully completed. Thank you for shopping with us!`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'ORDER_CANCELLED' as NotificationType,
    title: 'Order Cancelled',
    message: `Your order #${orderId} has been cancelled. Please contact support if you have any questions.`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'ORDER_FAILED' as NotificationType,
    title: 'Payment Failed',
    message: `Your payment for order #${orderId} could not be processed. Please try again or contact support.`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'ORDER_REFUNDED' as NotificationType,
    title: 'Refund Processed',
    message: `Your refund of ${currency} ${refundAmount.toFixed(2)} for order #${orderId} has been processed.`,
    url: `/account/orders/${orderId}`,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
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
    type: 'QUOTATION_ACCEPTED' as NotificationType,
    title: 'Quotation Accepted',
    message: `Your quotation #${quotationId} has been accepted. We will proceed with your order.`,
    url: `/account/quotes/${quotationId}`,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'QUOTATION_REJECTED' as NotificationType,
    title: 'Quotation Update',
    message: `Your quotation #${quotationId} could not be accepted. Please contact us for alternatives.`,
    url: `/account/quotes/${quotationId}`,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'EMAIL_VERIFICATION' as NotificationType,
    title: 'Verify Your Email',
    message: `Please verify your email address ${email} to complete your registration.`,
    url: '/account/settings',
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    await sendNotificationEmail(payload, email);
  }
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
    type: 'PASSWORD_RESET' as NotificationType,
    title: 'Password Reset',
    message: 'A password reset request has been initiated for your account.',
    url: '/account/settings',
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'ACCOUNT_UPDATED' as NotificationType,
    title: 'Account Updated',
    message: 'Your account information has been successfully updated.',
    url: '/account/settings',
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'SECURITY_ALERT' as NotificationType,
    title: 'Security Alert',
    message: 'Unusual activity detected on your account. Please review your security settings.',
    url: '/account/settings',
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
    type: 'NEW_PRODUCT_LAUNCH' as NotificationType,
    title: 'New Product Available',
    message: `Check out our new product: ${productName}`,
    url: `/products/${productId}`,
  };
  const result = await notificationService.createNotification(payload);
  if (result.success) {
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userEmail = userData?.email;
      const userName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim();
      await sendNotificationEmail(payload, userEmail, userName);
    }
  }
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
      type: 'ADMIN_NEW_USER' as NotificationType,
      title: 'New User Registered',
      message: `New user ${userName} (${userEmail}) has registered.`,
      url: '/dashboard/users',
    }
  );
}