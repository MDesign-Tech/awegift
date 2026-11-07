// ------------------------ ORDER STATUS MANAGEMENT ------------------------

// Only statuses relevant to local trading
export const ORDER_STATUSES = {
  PENDING: "pending",        // Order placed by user
  CONFIRMED: "confirmed",    // Admin confirms order
  READY: "ready",            // Admin marks order ready for delivery
  COMPLETED: "completed",    // User collects goods
  CANCELLED: "cancelled",    // Order cancelled
} as const;

export const PAYMENT_STATUSES = {
  PENDING: "pending",   // Payment not yet completed
  PAID: "paid",         // Paid via mobile money or online
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_METHODS = {
  ONLINE: "online",
  PAWAPAY: "pawapay",
  MTN: "mtn",
  AIRTEL: "airtel",
} as const;

// ------------------------ TYPES ------------------------
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];
export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

// ------------------------ ROLE-BASED VISIBILITY ------------------------
export const getVisibleOrderStatuses = (userRole: string): OrderStatus[] => {
  switch (userRole) {
    case "admin":
      return Object.values(ORDER_STATUSES); // Admin sees all
    case "user":
      return [
        ORDER_STATUSES.PENDING,
        ORDER_STATUSES.CONFIRMED,
        ORDER_STATUSES.READY,
        ORDER_STATUSES.COMPLETED,
        ORDER_STATUSES.CANCELLED,
      ];
    default:
      return [];
  }
};

// ------------------------ ROLE-BASED STATUS UPDATE ------------------------
export const canUpdateOrderStatus = (
  userRole: string,
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean => {
  switch (userRole) {
    case "admin":
      // Admin can move orders through the full workflow
      return true;

    case "user":
      // User can only mark order as completed after delivery
      return currentStatus === ORDER_STATUSES.READY && newStatus === ORDER_STATUSES.COMPLETED;

    default:
      return false;
  }
};

// ------------------------ ROLE-BASED PAYMENT UPDATE ------------------------
export const canUpdatePaymentStatus = (
  userRole: string,
  paymentMethod: PaymentMethod,
  currentPaymentStatus: PaymentStatus,
  newPaymentStatus: PaymentStatus,
  newPaymentMethod?: PaymentMethod
): boolean => {
  switch (userRole) {
    case "admin":
      return true; // Admin can update anything

    case "user":
      return false;

    default:
      return false;
  }
};

// ------------------------ NEXT POSSIBLE STATUS ------------------------
export const getNextPossibleStatuses = (
  userRole: string,
  currentStatus: OrderStatus
): OrderStatus[] => {
  const possibleStatuses: OrderStatus[] = [];
  Object.values(ORDER_STATUSES).forEach((status) => {
    if (canUpdateOrderStatus(userRole, currentStatus, status) && status !== currentStatus) {
      possibleStatuses.push(status);
    }
  });
  return possibleStatuses;
};

// ------------------------ DISPLAY INFO ------------------------
export const getStatusDisplayInfo = (status: OrderStatus) => {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: "⏳", description: "Order placed, awaiting confirmation" };
    case ORDER_STATUSES.CONFIRMED:
      return { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: "✅", description: "Order confirmed by admin" };
    case ORDER_STATUSES.READY:
      return { label: "Ready", color: "bg-purple-100 text-purple-800", icon: "📦", description: "Order ready for delivery" };
    case ORDER_STATUSES.COMPLETED:
      return { label: "Completed", color: "bg-green-100 text-green-800", icon: "✅", description: "Order collected by customer" };
    case ORDER_STATUSES.CANCELLED:
      return { label: "Cancelled", color: "bg-red-100 text-red-800", icon: "❌", description: "Order cancelled" };
    default:
      return { label: "Unknown", color: "bg-gray-100 text-gray-800", icon: "❓", description: "Unknown status" };
  }
};

export const getPaymentStatusDisplayInfo = (status: PaymentStatus, method: PaymentMethod) => {
  let providerLabel = "";
  if (method === PAYMENT_METHODS.MTN) providerLabel = "mtn";
  if (method === PAYMENT_METHODS.AIRTEL) providerLabel = "airtel";
  if (method === PAYMENT_METHODS.ONLINE) providerLabel = "Online";
  if (method === PAYMENT_METHODS.PAWAPAY) providerLabel = "PawaPay";

  switch (status) {
    case PAYMENT_STATUSES.PENDING:
      return { label: `${providerLabel} Payment Pending`, color: "bg-yellow-100 text-yellow-800", icon: "⏳" };
    case PAYMENT_STATUSES.PAID:
      return { label: `Paid via ${providerLabel}`, color: "bg-green-100 text-green-800", icon: "✅" };
    case PAYMENT_STATUSES.FAILED:
      return { label: `${providerLabel} Payment Failed`, color: "bg-red-100 text-red-800", icon: "❌" };
    case PAYMENT_STATUSES.REFUNDED:
      return { label: `${providerLabel} Refunded`, color: "bg-gray-100 text-gray-800", icon: "↩️" };
    default:
      return { label: "Unknown", color: "bg-gray-100 text-gray-800", icon: "❓" };
  }
};

// ------------------------ VALID STATUS TRANSITION ------------------------
export const isValidStatusTransition = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean => {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.READY, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.READY]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.COMPLETED]: [], // Final
    [ORDER_STATUSES.CANCELLED]: [], // Final
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};
