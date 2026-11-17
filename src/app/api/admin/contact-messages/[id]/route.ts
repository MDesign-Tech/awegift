import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";
import { hasPermission, UserRole } from "@/lib/rbac/roles";

async function authorize() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await fetchUserFromFirestore(session.user.id);
  if (!user) return { response: NextResponse.json({ error: "User deleted", code: "USER_DELETED" }, { status: 401 }) };
  const role = session.user.role as UserRole;
  if (user.role !== "admin" || role !== "admin" || !hasPermission(role, "canManageContactMessages")) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!id || id.includes("/")) return NextResponse.json({ error: "Invalid message ID." }, { status: 400 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid update." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.status !== undefined) {
    if (!["new", "read", "archived"].includes(body.status)) return NextResponse.json({ error: "Use Reply to Customer to mark a message Replied." }, { status: 400 });
    update.status = body.status;
  }
  if (body.adminNotes !== undefined) {
    if (typeof body.adminNotes !== "string" || body.adminNotes.length > 5000) return NextResponse.json({ error: "Admin notes must be under 5,000 characters." }, { status: 400 });
    update.adminNotes = body.adminNotes.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  }
  if (Object.keys(update).length === 1) return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
  const ref = adminDb.collection("contactMessages").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ error: "Message not found." }, { status: 404 });
  await ref.update(update);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!id || id.includes("/")) return NextResponse.json({ error: "Invalid message ID." }, { status: 400 });
  const ref = adminDb.collection("contactMessages").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ error: "Message not found." }, { status: 404 });
  await ref.delete();
  return NextResponse.json({ success: true });
}
