// ------------------------ QUOTE STATUS MANAGEMENT ------------------------

export const QUOTE_STATUSES = {
  PENDING: "pending",                     // user requested, waiting for admin
  RESPONDED: "responded",                   // admin sent price
  WAITING_CUSTOMER: "waiting_customer",     // admin asked user more info
  NEGOTIATION: "negotiation",               // back-and-forth messaging
  ACCEPTED: "accepted",                     // user accepted price
  REJECTED: "rejected",                     // user or admin rejected
  EXPIRED: "expired",                       // price expired
} as const;

// ------------------------ TYPES ------------------------
export type QuoteStatus = (typeof QUOTE_STATUSES)[keyof typeof QUOTE_STATUSES];

// ------------------------ ROLE-BASED VISIBILITY ------------------------
export const getVisibleQuoteStatuses = (userRole: string): QuoteStatus[] => {
  switch (userRole) {
    case "admin":
      return Object.values(QUOTE_STATUSES); // Admin sees all
    case "user":
      return [
        QUOTE_STATUSES.PENDING,
        QUOTE_STATUSES.RESPONDED,
        QUOTE_STATUSES.WAITING_CUSTOMER,
        QUOTE_STATUSES.NEGOTIATION,
        QUOTE_STATUSES.ACCEPTED,
        QUOTE_STATUSES.REJECTED,
        QUOTE_STATUSES.EXPIRED,
      ];
    default:
      return [];
  }
};

// ------------------------ ROLE-BASED STATUS UPDATE ------------------------
export const canUpdateQuoteStatus = (
  userRole: string,
  currentStatus: QuoteStatus,
  newStatus: QuoteStatus
): boolean => {
  switch (userRole) {
    case "admin":
      // Admin can move quotes through the full workflow
      return true;

    case "user":
      // User can only accept or reject responded quotes, or reply in negotiation/waiting_customer
      return (
        (currentStatus === QUOTE_STATUSES.RESPONDED &&
          (newStatus === QUOTE_STATUSES.ACCEPTED || newStatus === QUOTE_STATUSES.REJECTED)) ||
        (currentStatus === QUOTE_STATUSES.NEGOTIATION || currentStatus === QUOTE_STATUSES.WAITING_CUSTOMER)
      );

    default:
      return false;
  }
};

// ------------------------ NEXT POSSIBLE STATUS ------------------------
export const getNextPossibleStatuses = (
  userRole: string,
  currentStatus: QuoteStatus
): QuoteStatus[] => {
  const possibleStatuses: QuoteStatus[] = [];
  Object.values(QUOTE_STATUSES).forEach((status) => {
    if (canUpdateQuoteStatus(userRole, currentStatus, status) && status !== currentStatus) {
      possibleStatuses.push(status);
    }
  });
  return possibleStatuses;
};

// ------------------------ DISPLAY INFO ------------------------
export const getStatusDisplayInfo = (status: QuoteStatus) => {
  switch (status) {
    case QUOTE_STATUSES.PENDING:
      return { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: "⏳", description: "Quote requested, awaiting response" };
    case QUOTE_STATUSES.RESPONDED:
      return { label: "Responded", color: "bg-blue-100 text-blue-800", icon: "💰", description: "Price quote provided" };
    case QUOTE_STATUSES.WAITING_CUSTOMER:
      return { label: "Waiting for Customer", color: "bg-orange-100 text-orange-800", icon: "❓", description: "Waiting for more information" };
    case QUOTE_STATUSES.NEGOTIATION:
      return { label: "Negotiating", color: "bg-purple-100 text-purple-800", icon: "💬", description: "In negotiation" };
    case QUOTE_STATUSES.ACCEPTED:
      return { label: "Accepted", color: "bg-green-100 text-green-800", icon: "✅", description: "Quote accepted" };
    case QUOTE_STATUSES.REJECTED:
      return { label: "Rejected", color: "bg-red-100 text-red-800", icon: "❌", description: "Quote rejected" };
    case QUOTE_STATUSES.EXPIRED:
      return { label: "Expired", color: "bg-gray-100 text-gray-800", icon: "⏰", description: "Quote expired" };
    default:
      return { label: "Unknown", color: "bg-gray-100 text-gray-800", icon: "❓", description: "Unknown status" };
  }
};

// ------------------------ VALID STATUS TRANSITION ------------------------
export const isValidStatusTransition = (
  currentStatus: QuoteStatus,
  newStatus: QuoteStatus
): boolean => {
  const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
    [QUOTE_STATUSES.PENDING]: [QUOTE_STATUSES.RESPONDED, QUOTE_STATUSES.WAITING_CUSTOMER, QUOTE_STATUSES.REJECTED],
    [QUOTE_STATUSES.RESPONDED]: [QUOTE_STATUSES.ACCEPTED, QUOTE_STATUSES.REJECTED, QUOTE_STATUSES.NEGOTIATION],
    [QUOTE_STATUSES.WAITING_CUSTOMER]: [QUOTE_STATUSES.NEGOTIATION, QUOTE_STATUSES.RESPONDED, QUOTE_STATUSES.REJECTED],
    [QUOTE_STATUSES.NEGOTIATION]: [QUOTE_STATUSES.ACCEPTED, QUOTE_STATUSES.REJECTED, QUOTE_STATUSES.WAITING_CUSTOMER],
    [QUOTE_STATUSES.ACCEPTED]: [], // Final
    [QUOTE_STATUSES.REJECTED]: [], // Final
    [QUOTE_STATUSES.EXPIRED]: [], // Final
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};