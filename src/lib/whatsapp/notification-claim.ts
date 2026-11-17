export interface NotificationClaim {
  claimed: boolean;
  sentPartCount: number;
}

export function getNotificationClaim(
  previous: Record<string, unknown>,
  now: number
): NotificationClaim {
  if (previous.status === "sent") {
    return { claimed: false, sentPartCount: 0 };
  }

  const leaseExpiresAt =
    typeof previous.leaseExpiresAt === "string"
      ? Date.parse(previous.leaseExpiresAt)
      : 0;
  if (previous.status === "sending" && leaseExpiresAt > now) {
    return { claimed: false, sentPartCount: 0 };
  }

  const retryAfter =
    typeof previous.retryAfter === "string"
      ? Date.parse(previous.retryAfter)
      : 0;
  if (previous.status === "failed" && retryAfter > now) {
    return { claimed: false, sentPartCount: 0 };
  }

  const sentPartCount =
    Number.isSafeInteger(previous.sentPartCount) &&
    Number(previous.sentPartCount) >= 0
      ? Number(previous.sentPartCount)
      : 0;
  return { claimed: true, sentPartCount };
}
