import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { fetchUserFromFirestore } from "@/lib/firebase/adminUser";
import { hasPermission, UserRole } from "@/lib/rbac/roles";

export const runtime = "nodejs";

function iso(value: any): string | null {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function text(value: any): string { return typeof value === "string" ? value : ""; }
function normalizeStatus(payment: any, order: any): string {
  const orderStatus = String(order?.paymentStatus || "").toLowerCase();
  if (["refunded", "refund_completed"].includes(orderStatus)) return "refunded";
  const raw = String(payment.status || orderStatus || "pending").toLowerCase();
  if (["paid", "completed", "successful", "duplicate_payment"].includes(raw)) return "successful";
  if (["failed", "rejected"].includes(raw)) return "failed";
  if (["refunded", "refund_completed"].includes(raw)) return "refunded";
  if (["cancelled", "canceled", "expired"].includes(raw)) return "cancelled";
  return "pending";
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await fetchUserFromFirestore(session.user.id);
    if (!user) return NextResponse.json({ error: "User deleted", code: "USER_DELETED" }, { status: 401 });
    const role = session.user.role as UserRole;
    if (!role || !hasPermission(role, "canViewTransactions")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [paymentSnapshot, orderSnapshot] = await Promise.all([
      adminDb.collection("pawapayPayments").get(),
      adminDb.collection("orders").get(),
    ]);
    const orders = new Map(orderSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
    const payments = paymentSnapshot.docs.map(doc => {
      const payment = doc.data();
      const order = orders.get(String(payment.orderId || "")) as any;
      return {
        id: doc.id,
        transactionId: text(payment.depositId) || text(payment.checkoutId) || doc.id,
        orderId: text(payment.orderId),
        customerName: text(order?.customerName) || text(order?.name) || "Customer",
        email: text(order?.customerEmail) || text(order?.email),
        phone: text(payment.phoneNumber) || text(order?.customerPhone) || text(order?.phoneNumber) || text(order?.phone),
        amount: Number(payment.amount ?? order?.totalAmount ?? order?.total ?? 0),
        currency: text(payment.currency) || text(order?.currency) || "RWF",
        method: text(order?.paymentMethod) || "Mobile Money",
        provider: text(payment.provider) || "PawaPay",
        status: normalizeStatus(payment, order),
        providerStatus: text(payment.providerStatus) || text(payment.status),
        createdAt: iso(payment.createdAt) || iso(order?.createdAt),
        completedAt: iso(payment.completedAt) || iso(payment.confirmedAt),
        reference: text(payment.depositId) || text(payment.checkoutId) || doc.id,
        failureReason: typeof payment.failureReason === "string" ? payment.failureReason : payment.failureReason?.failureMessage || text(payment.failureMessage),
        orderStatus: text(order?.status),
        orderTotal: Number(order?.totalAmount ?? order?.total ?? 0),
      };
    });
    const trackedOrders = new Set(paymentSnapshot.docs.map(doc => String(doc.data().orderId || "")));
    for (const [id, raw] of orders) {
      const order = raw as any;
      if (trackedOrders.has(id) || !order.paymentMethod) continue;
      payments.push({
        id: String(order.pawapayDepositId || order.pawapayCheckoutId || id),
        transactionId: text(order.transactionId) || text(order.paymentReference) || text(order.pawapayDepositId) || text(order.pawapayCheckoutId) || id,
        orderId: id,
        customerName: text(order.customerName) || text(order.name) || "Customer",
        email: text(order.customerEmail) || text(order.email),
        phone: text(order.customerPhone) || text(order.phoneNumber) || text(order.phone),
        amount: Number(order.totalAmount ?? order.total ?? 0),
        currency: text(order.currency) || "RWF",
        method: text(order.paymentMethod),
        provider: text(order.paymentProvider) || text(order.paymentMethod),
        status: normalizeStatus({}, order),
        providerStatus: text(order.pawapayPaymentStatus) || text(order.paymentStatus),
        createdAt: iso(order.createdAt),
        completedAt: null,
        reference: text(order.pawapayDepositId) || text(order.pawapayCheckoutId) || id,
        failureReason: "",
        orderStatus: text(order.status),
        orderTotal: Number(order.totalAmount ?? order.total ?? 0),
      });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").toLowerCase();
    const status = searchParams.get("status") || "all";
    const method = searchParams.get("method") || "all";
    const provider = searchParams.get("provider") || "all";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const sort = searchParams.get("sort") || "newest";
    const filtered = payments.filter(payment => {
      const haystack = [payment.customerName, payment.email, payment.transactionId, payment.orderId].join(" ").toLowerCase();
      const day = payment.createdAt?.slice(0, 10) || "";
      return (!q || haystack.includes(q)) && (status === "all" || payment.status === status) && (method === "all" || payment.method === method) && (provider === "all" || payment.provider === provider) && (!from || day >= from) && (!to || day <= to);
    });
    filtered.sort((a, b) => sort === "oldest" ? (a.createdAt || "").localeCompare(b.createdAt || "") : sort === "amount" ? b.amount - a.amount : (b.createdAt || "").localeCompare(a.createdAt || ""));
    const successful = payments.filter(payment => payment.status === "successful");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = 20;
    return NextResponse.json({
      summary: { total: payments.length, successful: successful.length, pending: payments.filter(p => p.status === "pending").length, failed: payments.filter(p => p.status === "failed").length, revenue: successful.reduce((sum, p) => sum + p.amount, 0), currency: successful[0]?.currency || payments[0]?.currency || "RWF" },
      payments: filtered.slice((page - 1) * pageSize, page * pageSize),
      methods: Array.from(new Set(payments.map(payment => payment.method).filter(Boolean))),
      providers: Array.from(new Set(payments.map(payment => payment.provider).filter(Boolean))),
      totalFiltered: filtered.length,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Admin payments could not be loaded.", error);
    return NextResponse.json({ error: "Failed to fetch payments." }, { status: 500 });
  }
}
