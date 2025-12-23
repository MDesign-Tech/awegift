import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { notificationService } from '@/lib/notification/service';
import { CreateNotificationPayload } from '../../../../../type';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const notifications = await notificationService.getAllNotifications();
    // Filter to show only system notifications sent to admin
    const adminNotifications = notifications.filter(notification => notification.recipientRole === 'admin');
    return NextResponse.json({ notifications: adminNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body: CreateNotificationPayload = await request.json();
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

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { ids } = body;
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
    }
    // Delete each notification
    const deletePromises = ids.map(id => notificationService.deleteNotification(id));
    const results = await Promise.all(deletePromises);
    const successCount = results.filter(result => result).length;
    return NextResponse.json({ success: true, deletedCount: successCount }, { status: 200 });
  } catch (error) {
    console.error('Error bulk deleting notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}