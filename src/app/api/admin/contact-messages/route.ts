import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";
import { hasPermission, UserRole } from "@/lib/rbac/roles";

export const runtime = "nodejs";
const statuses = ["new", "read", "replied", "archived"] as const;
function iso(value: any): string | null {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) return NextResponse.json({ error: "User deleted", code: "USER_DELETED" }, { status: 401 });
    const role = session.user.role as UserRole;
    if (user.role !== "admin" || role !== "admin" || !hasPermission(role, "canManageContactMessages")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const snapshot = await adminDb.collection("contactMessages").get();
    const all = snapshot.docs.map(doc => {
      const raw = doc.data();
      return { id: doc.id, messageId: String(raw.messageId || raw.id || doc.id), fullName: String(raw.fullName || raw.name || [raw.firstName, raw.lastName].filter(Boolean).join(" ") || "Customer"), email: String(raw.email || ""), phone: String(raw.phone || ""), subject: String(raw.subject || ""), message: String(raw.message || ""), status: statuses.includes(String(raw.status).toLowerCase() as any) ? String(raw.status).toLowerCase() : "new", adminNotes: String(raw.adminNotes || ""), replyHistory: Array.isArray(raw.replyHistory) ? raw.replyHistory : [], createdAt: iso(raw.createdAt), updatedAt: iso(raw.updatedAt), emailStatus: String(raw.emailStatus || "unknown") };
    }).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const counts = { total: all.length, new: 0, read: 0, replied: 0, archived: 0 };
    for (const item of all) counts[item.status as keyof typeof counts]++;
    const params = new URL(request.url).searchParams;
    const query = (params.get("q") || "").trim().toLowerCase();
    const status = params.get("status") || "all";
    const from = params.get("from") || "";
    const to = params.get("to") || "";
    const sort = params.get("sort") || "newest";
    const filtered = all.filter(item => {
      const matchesText = !query || [item.messageId, item.fullName, item.email, item.subject, item.message].join(" ").toLowerCase().includes(query);
      const day = item.createdAt?.slice(0, 10) || "";
      return matchesText && (status === "all" || item.status === status) && (!from || day >= from) && (!to || day <= to);
    });
    if (sort === "oldest") filtered.reverse();
    const page = Math.max(1, Math.floor(Number(params.get("page") || 1)));
    const pageSize = 25;
    return NextResponse.json({ messages: filtered.slice((page - 1) * pageSize, page * pageSize), totalFiltered: filtered.length, page, pageSize, summary: counts });
  } catch (error) {
    console.error("Admin contact messages could not be loaded.", error);
    return NextResponse.json({ error: "Failed to load contact messages." }, { status: 500 });
  }
}
