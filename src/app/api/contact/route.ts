import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { EmailService, emailService } from "@/lib/email/service";

export const runtime = "nodejs";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\r\n?/g, "\n").trim();

export async function POST(request: NextRequest) {
  let savedMessageId: string | null = null;
  try {
    if (Number(request.headers.get("content-length") || 0) > 12_000) return NextResponse.json({ error: "Message is too large." }, { status: 413 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid form submission." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
    const data = body as Record<string, unknown>;
    if (typeof data.website === "string" && data.website.trim()) return NextResponse.json({ success: true, message: "Your message has been received." }, { status: 201 });

    const legacyName = [data.firstName, data.lastName].filter(value => typeof value === "string").join(" ");
    const fullName = clean(typeof data.fullName === "string" ? data.fullName : legacyName).replace(/\s+/g, " ");
    const email = clean(typeof data.email === "string" ? data.email : "").toLowerCase();
    const phone = clean(typeof data.phone === "string" ? data.phone : "").replace(/\s+/g, " ");
    const subject = clean(typeof data.subject === "string" ? data.subject : "").replace(/\s+/g, " ");
    const message = clean(typeof data.message === "string" ? data.message : "");
    if (!fullName || fullName.length > 160 || !EMAIL_PATTERN.test(email) || email.length > 254 || phone.length > 32 || !subject || subject.length > 160 || message.length < 10 || message.length > 5000) {
      return NextResponse.json({ error: "Please check your name, email, phone, subject, and message (10 to 5,000 characters)." }, { status: 400 });
    }

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = request.headers.get("x-real-ip") || forwarded || "unknown";
    const ipKey = createHash("sha256").update(ip).digest("hex");
    const rateRef = adminDb.collection("contactRateLimits").doc(ipKey);
    const now = Date.now();
    const allowed = await adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(rateRef);
      const record = snapshot.data();
      const start = Number(record?.windowStartedAt || 0);
      const count = start > 0 && now - start < 60 * 60 * 1000 ? Number(record?.count || 0) : 0;
      if (count >= 5) return false;
      transaction.set(rateRef, { windowStartedAt: count ? start : now, count: count + 1, updatedAt: new Date(now).toISOString() });
      return true;
    });
    if (!allowed) return NextResponse.json({ error: "Too many messages have been sent. Please try again later." }, { status: 429 });

    const messageRef = adminDb.collection("contactMessages").doc();
    savedMessageId = messageRef.id;
    const createdAt = new Date().toISOString();
    const messageRecord = { messageId: messageRef.id, id: messageRef.id, fullName, name: fullName, firstName: fullName.split(/\s+/)[0], lastName: fullName.split(/\s+/).slice(1).join(" "), email, phone, subject, message, status: "new", adminNotes: "", replyHistory: [], emailStatus: "queued", createdAt, updatedAt: createdAt };
    await messageRef.create(messageRecord);

    // Claim notification once per saved message so retries cannot send a duplicate.
    const claim = await adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(messageRef);
      if (!snapshot.exists || snapshot.data()?.emailStatus !== "queued") return false;
      transaction.update(messageRef, { emailStatus: "sending", emailClaimedAt: new Date().toISOString() });
      return true;
    });
    if (claim) {
      try {
        if (!EmailService.isConfigured()) throw new Error("Email service is not configured");
        const sentAt = new Date().toISOString();
        const result = await emailService.sendEmail({
          type: "CONTACT_MESSAGE",
          to: process.env.CONTACT_RECIPIENT_EMAIL || process.env.ADMIN_EMAIL || "support@awegift.com",
          contactMessage: { name: fullName, email, phone, subject, message, messageId: messageRef.id, submittedAt: createdAt },
        });
        if (!result.success) throw new Error(result.error || "Email delivery failed");
        await messageRef.update({ emailStatus: "sent", emailSentAt: sentAt, updatedAt: sentAt });
      } catch (error) {
        console.error("Contact message notification email failed.", { messageId: messageRef.id, error: error instanceof Error ? error.message : "unknown" });
        try { await messageRef.update({ emailStatus: "failed", updatedAt: new Date().toISOString() }); } catch (updateError) { console.error("Could not record contact notification failure.", { messageId: messageRef.id }); }
      }
    }
    return NextResponse.json({ success: true, messageId: messageRef.id, message: "Your message has been received." }, { status: 201 });
  } catch (error) {
    console.error("Contact form submission failed.", { messageId: savedMessageId, error: error instanceof Error ? error.message : "unknown" });
    if (savedMessageId) return NextResponse.json({ success: true, messageId: savedMessageId, message: "Your message has been received." }, { status: 201 });
    return NextResponse.json({ error: "We could not send your message right now. Please try again." }, { status: 500 });
  }
}
