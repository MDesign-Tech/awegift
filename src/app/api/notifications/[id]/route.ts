// app/api/notifications/[id]/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { notificationService } from '@/lib/notification/service';
import { UserRole } from '@/lib/rbac/roles';

interface Params {
  params: { id: string };
}

/**
 * PATCH /api/notifications/:id
 * Mark a single notification as read
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const notificationId = params.id;

    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notificationId = params.id;

    const success = await notificationService.deleteNotification(notificationId);
    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
