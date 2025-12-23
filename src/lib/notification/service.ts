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
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, userRole: UserRole): Promise<boolean> {
    try {
      const notificationsRef = adminDb.collection(this.notificationsCollection)
        .where('recipientId', '==', userId)
        .where('recipientRole', '==', userRole)
        .where('isRead', '==', false);

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
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, userRole: UserRole): Promise<NotificationData[]> {
    try {
      const notificationsRef = adminDb.collection(this.notificationsCollection)
        .where('recipientId', '==', userId)
        .where('recipientRole', '==', userRole)
        .orderBy('createdAt', 'desc');

      const snapshot = await notificationsRef.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      })) as NotificationData[];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
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
   * Get all notifications (for admin)
   */
  async getAllNotifications(): Promise<NotificationData[]> {
    try {
      const notificationsRef = adminDb.collection(this.notificationsCollection)
        .orderBy('createdAt', 'desc');

      const snapshot = await notificationsRef.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      })) as NotificationData[];
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      return [];
    }
  }

  /**
   * Set up real-time listener for user notifications
   */
  onUserNotificationsChange(
    userId: string,
    userRole: UserRole,
    callback: (notifications: NotificationData[]) => void
  ): () => void {
    const notificationsRef = adminDb.collection(this.notificationsCollection)
      .where('recipientId', '==', userId)
      .where('recipientRole', '==', userRole)
      .orderBy('createdAt', 'desc');

    return notificationsRef.onSnapshot((snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
      })) as NotificationData[];

      callback(notifications);
    }, (error) => {
      console.error('Error listening to notifications:', error);
    });
  }

  /**
   * Set up real-time listener for all notifications (admin)
   */
  onAllNotificationsChange(callback: (notifications: NotificationData[]) => void): () => void {
    const notificationsRef = adminDb.collection(this.notificationsCollection)
      .orderBy('createdAt', 'desc');

    return notificationsRef.onSnapshot((snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
      })) as NotificationData[];

      callback(notifications);
    }, (error) => {
      console.error('Error listening to all notifications:', error);
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();