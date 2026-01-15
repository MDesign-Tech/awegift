// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification/service';
import { CreateNotificationPayload, NotificationData } from '../../../../type';
import { UserRole } from '@/lib/rbac/roles';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET /api/notifications?scope=personal|admin
 * Fetch notifications based on scope
 */
export async function GET(request: NextRequest) {
  try {

    const session = await getServerSession(authOptions);
    console.log('Session retrieved:', !!session);
    if (session) console.log('Session user:', session.user);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const scope = (url.searchParams.get('scope') || 'personal') as 'personal' | 'admin';

    // Role-based access
    if (scope === 'admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let notifications: NotificationData[] = [];

    if (scope === 'admin') {
      notifications = await notificationService.getAdminNotifications();
    } else {
      notifications = await notificationService.getAccountNotifications(session.user.id!, session.user.role as UserRole);
    }

    return NextResponse.json({ success: true, notifications }, { status: 200 });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: CreateNotificationPayload = await request.json();

    // Validate scope
    if (body.scope === 'admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Default scope
    if (!body.scope) body.scope = 'personal';

    const result = await notificationService.createNotification(body);

    if (result.success) {
      return NextResponse.json({ success: true, notificationId: result.notificationId }, { status: 201 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Mark all notifications as read
 * Body: { scope?: 'admin'|'personal' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const scope = (body.scope || 'personal') as 'personal' | 'admin';

    // Role-based access
    if (scope === 'admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let success;
    if (scope === 'admin') {
      // For admin scope, mark all admin notifications as read
      const adminNotifications = await notificationService.getAdminNotifications();
      const unreadAdminNotifications = adminNotifications.filter(n => !n.isRead && n.id);
      const updatePromises = unreadAdminNotifications.map(n => notificationService.markAsRead(n.id!));
      await Promise.all(updatePromises);
      success = true;
    } else {
      // For personal scope, mark all user notifications as read
      success = await notificationService.markAllAsRead(session.user.id!, session.user.role as UserRole);
    }

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications
 * Bulk delete notifications
 * Body: { ids: string[], scope?: 'admin'|'personal' }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { ids, scope } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
    }

    // Role-based access
    if (scope === 'admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete each notification
    const deletePromises = ids.map(id => notificationService.deleteNotification(id));
    const results = await Promise.all(deletePromises);
    const successCount = results.filter(r => r).length;

    return NextResponse.json({ success: true, deletedCount: successCount }, { status: 200 });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
