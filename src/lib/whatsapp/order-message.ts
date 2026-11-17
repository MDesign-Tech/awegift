const MAX_WHATSAPP_MESSAGE_LENGTH = 4096;

type OrderItem = {
  title?: unknown;
  name?: unknown;
  quantity?: unknown;
  price?: unknown;
};

export interface WhatsAppOrder {
  id?: unknown;
  orderId?: unknown;
  createdAt?: unknown;
  status?: unknown;
  paymentMethod?: unknown;
  paymentStatus?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  customerEmail?: unknown;
  deliveryMethod?: unknown;
  orderAddress?: unknown;
  notes?: unknown;
  customerNotes?: unknown;
  items?: unknown;
  subtotal?: unknown;
  deliveryFee?: unknown;
  discount?: unknown;
  totalAmount?: unknown;
  currency?: unknown;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeText(value: unknown, fallback = "Not provided", maxLength = 500) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, maxLength);
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value: unknown): string {
  return `${new Intl.NumberFormat("en-RW", {
    maximumFractionDigits: 2,
  }).format(numberValue(value))} RWF`;
}

function orderDate(value: unknown): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;
  if (!date || Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-RW", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Kigali",
  }).format(date);
}

function formatItem(item: OrderItem): string {
  const title = safeText(item.title ?? item.name, "Product", 600);
  const quantity = Math.max(0, numberValue(item.quantity));
  const unitPrice = numberValue(item.price);
  return `• ${title}\n  Quantity: ${quantity} | Unit Price: ${money(unitPrice)} | Subtotal: ${money(unitPrice * quantity)}`;
}

export function buildOrderWhatsAppMessages(
  order: WhatsAppOrder
): string[] {
  const orderId = safeText(order.id ?? order.orderId, "Unknown");
  const address = record(order.orderAddress);
  const items = Array.isArray(order.items)
    ? order.items.map((item) => record(item) as OrderItem)
    : [];
  const calculatedSubtotal = items.reduce(
    (sum, item) =>
      sum + numberValue(item.price) * Math.max(0, numberValue(item.quantity)),
    0
  );
  const subtotal = order.subtotal ?? calculatedSubtotal;
  const notes = order.customerNotes ?? order.notes;

  const header = [
    "🛍️ *NEW ORDER RECEIVED – AWEGIFT*",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "📦 *ORDER INFORMATION*",
    `• Order Number: #${orderId}`,
    `• Order Date: ${orderDate(order.createdAt)}`,
    `• Order Status: ${safeText(order.status)}`,
    `• Payment Method: ${safeText(order.paymentMethod)}`,
    `• Payment Status: ${safeText(order.paymentStatus)}`,
    "",
    "👤 *CUSTOMER DETAILS*",
    `• Name: ${safeText(order.customerName)}`,
    `• Phone: ${safeText(order.customerPhone)}`,
    `• Email: ${safeText(order.customerEmail)}`,
    "",
    "📍 *DELIVERY INFORMATION*",
    `• Delivery Method: ${safeText(order.deliveryMethod, "Delivery")}`,
    `• Delivery Address: ${safeText(address.address)}`,
    `• Additional Instructions: ${safeText(notes, "None")}`,
    "",
    "🛒 *ORDER ITEMS*",
  ].join("\n");
  const footer = [
    "",
    "💰 *PAYMENT SUMMARY*",
    `• Subtotal: ${money(subtotal)}`,
    `• Delivery Fee: ${money(order.deliveryFee)}`,
    `• Discount: ${money(order.discount)}`,
    `• Total Amount: ${money(order.totalAmount)}`,
    `• Currency: ${safeText(order.currency, "RWF")}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "🔔 Please check the AweGift admin dashboard for complete order details and take the necessary action.",
  ].join("\n");
  const itemLines = items.length
    ? items.map((item) => formatItem(item))
    : ["• No item details available"];
  const continuationHeader = `🛍️ *ORDER #${orderId} – ITEMS CONTINUED*`;
  const parts: string[] = [];
  let current = header;

  for (const itemLine of itemLines) {
    const addition = `\n${itemLine}`;
    const reserveFooter = footer.length + 2;
    if (
      current.length + addition.length + reserveFooter >
      MAX_WHATSAPP_MESSAGE_LENGTH
    ) {
      parts.push(current);
      current = continuationHeader;
    }

    current += addition;
  }

  if (current.length + footer.length <= MAX_WHATSAPP_MESSAGE_LENGTH) {
    current += footer;
    parts.push(current);
  } else {
    parts.push(current);
    parts.push(`${continuationHeader}${footer}`);
  }

  return parts;
}

export const WHATSAPP_MAX_MESSAGE_LENGTH = MAX_WHATSAPP_MESSAGE_LENGTH;
