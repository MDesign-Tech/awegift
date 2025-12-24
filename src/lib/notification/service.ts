import { adminDb } from '@/lib/firebase/admin';
import {
  NotificationData,
  CreateNotificationPayload,
  NotificationResponse,
  NotificationType
} from '../../../type';
import { UserRole } from '@/lib/rbac/roles';

/**
 * Notification service for managing notifications in Firestore
 */
export class NotificationService {
  private notificationsCollection = 'notifications';

  /**
   * Create a notification
   */
  async createNotification(payload: CreateNotificationPayload): Promise<NotificationResponse> {
    try {
      // Create notification data
      const notificationData: Omit<NotificationData, 'id'> = {
        recipientId: payload.recipientId,
        recipientRole: payload.recipientRole,
        scope: payload.scope || 'personal',
        type: payload.type,
        title: payload.title,
        message: payload.message,
        url: payload.url,
        isRead: false,
        createdAt: new Date(),
        ...(payload.data !== undefined && { data: payload.data }),
      };

      // Save to Firestore
      const docRef = await adminDb.collection(this.notificationsCollection).add(notificationData);
      const notificationId = docRef.id;

      // Update the document with the ID
      await docRef.update({ id: notificationId });

      return {
        success: true,
        notificationId,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create notification',
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const notificationRef = adminDb.collection(this.notificationsCollection).doc(notificationId);
      await notificationRef.update({ isRead: true });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string, userRole: UserRole, scope: 'personal' | 'admin' = 'personal'): Promise<boolean> {
    try {
      const notificationsRef = adminDb.collection(this.notificationsCollection)
        .where('recipientId', '==', userId)
        .where('recipientRole', '==', userRole)
        .where('isRead', '==', false);

      if (scope === 'admin') {
        notificationsRef.where('scope', '==', 'admin');
      }

      const snapshot = await notificationsRef.get();

      const updates = snapshot.docs.map(doc =>
        doc.ref.update({ isRead: true })
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const notificationRef = adminDb.collection(this.notificationsCollection).doc(notificationId);
      await notificationRef.delete();
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(userId: string, userRole: UserRole): Promise<number> {
    try {
      const notificationsRef = adminDb.collection(this.notificationsCollection)
        .where('recipientId', '==', userId)
        .where('recipientRole', '==', userRole)
        .where('isRead', '==', false);

      const snapshot = await notificationsRef.get();
      return snapshot.size;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Get account notifications (for API use)
   */
  async getAccountNotifications(userId: string, userRole: UserRole): Promise<NotificationData[]> {
    const snapshot = await adminDb.collection(this.notificationsCollection)
      .where('recipientId', '==', userId)
      .where('recipientRole', '==', userRole)
      .where('scope', '==', 'personal')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    })) as NotificationData[];
  }

  /**
   * Get admin notifications (for API use)
   */
  async getAdminNotifications(): Promise<NotificationData[]> {
    const snapshot = await adminDb.collection(this.notificationsCollection)
      .where('scope', '==', 'admin')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    })) as NotificationData[];
  }
}

// Export singleton instance
export const notificationService = new NotificationService();