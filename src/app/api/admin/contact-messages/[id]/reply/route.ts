import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { EmailService, emailService } from "@/lib/email/service";

export const runtime = "nodejs";
const clean = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\r\n?/g, "\n").trim();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) return NextResponse.json({ error: "User deleted", code: "USER_DELETED" }, { status: 401 });
    const role = session.user.role as UserRole;
    if (user.role !== "admin" || role !== "admin" || !hasPermission(role, "canManageContactMessages")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (!id || id.includes("/")) return NextResponse.json({ error: "Invalid message ID." }, { status: 400 });
    if (Number(request.headers.get("content-length") || 0) > 8_000) return NextResponse.json({ error: "Reply is too large." }, { status: 413 });
    let body: any;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid reply." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.subject !== "string" || typeof body.message !== "string") return NextResponse.json({ error: "A subject and message are required." }, { status: 400 });
    const subject = clean(body.subject).replace(/\s+/g, " ");
    const message = clean(body.message);
    if (subject.length < 2 || subject.length > 180 || message.length < 1 || message.length > 5000) return NextResponse.json({ error: "Enter a subject and a message under 5,000 characters." }, { status: 400 });

    const ref = adminDb.collection("contactMessages").doc(id);
    const claim = await adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return { error: "not_found" as const };
      const data = snapshot.data()!;
      const sendingAt = Date.parse(String(data.replyClaimedAt || ""));
      if (data.replySending === true && Number.isFinite(sendingAt) && Date.now() - sendingAt < 10 * 60 * 1000) return { error: "sending" as const };
      const email = String(data.email || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "email" as const };
      transaction.update(ref, { replySending: true, replyEmailStatus: "sending", replyClaimedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      return { email, fullName: String(data.fullName || data.name || "Customer"), messageId: String(data.messageId || data.id || id) };
    });
    if ("error" in claim) {
      if (claim.error === "not_found") return NextResponse.json({ error: "Message not found." }, { status: 404 });
      if (claim.error === "sending") return NextResponse.json({ error: "A reply is already being sent for this message." }, { status: 409 });
      return NextResponse.json({ error: "This message has no valid customer email address." }, { status: 409 });
    }

    if (!EmailService.isConfigured()) {
      await ref.update({ replySending: false, replyEmailStatus: "failed", updatedAt: new Date().toISOString() });
      return NextResponse.json({ error: "Email service is not configured." }, { status: 503 });
    }
    const result = await emailService.sendEmail({ type: "CONTACT_REPLY", to: claim.email, contactReply: { name: claim.fullName, email: claim.email, subject, message, messageId: claim.messageId } });
    if (!result.success) {
      console.error("Admin contact reply email delivery failed.", { messageId: id });
      await ref.update({ replySending: false, replyEmailStatus: "failed", updatedAt: new Date().toISOString() });
      return NextResponse.json({ error: "The reply email could not be sent. The message status was not changed." }, { status: 502 });
    }

    const sentAt = new Date().toISOString();
    await adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error("Contact message was removed while sending the reply.");
      const data = snapshot.data()!;
      const history = Array.isArray(data.replyHistory) ? data.replyHistory : [];
      transaction.update(ref, { status: "replied", replySending: false, replyEmailStatus: "sent", lastRepliedAt: sentAt, replyHistory: [...history, { subject, message, sentAt, sentBy: session.user.email || session.user.id }], updatedAt: sentAt });
    });
    return NextResponse.json({ success: true, message: "Reply sent successfully." });
  } catch (error) {
    console.error("Contact reply failed.", error);
    return NextResponse.json({ error: "The reply could not be completed." }, { status: 500 });
  }
}
