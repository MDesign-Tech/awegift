import "server-only";

import admin from "firebase-admin";

import { adminDb } from "@/lib/firebase/admin";
import {
  getWhatsAppCloudConfig,
  sendWhatsAppText,
  WhatsAppCloudApiError,
} from "@/lib/whatsapp/cloud-api";
import {
  buildOrderWhatsAppMessages,
  WhatsAppOrder,
} from "@/lib/whatsapp/order-message";
import { getNotificationClaim } from "@/lib/whatsapp/notification-claim";

const LEASE_DURATION_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 60 * 1000;

function errorCode(error: unknown): string {
  if (error instanceof WhatsAppCloudApiError) {
    if (error.httpStatus) return `http_${error.httpStatus}`;
    return error.retryable ? "temporary_failure" : "configuration";
  }
  return "unexpected_failure";
}

async function recordFailure(
  notificationRef: FirebaseFirestore.DocumentReference,
  orderId: string,
  error: unknown
) {
  const code = errorCode(error);
  try {
    await notificationRef.set(
      {
        orderId,
        status: "failed",
        lastErrorCode: code,
        retryAfter: new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
        leaseExpiresAt: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (recordError) {
    console.error("Could not record failed WhatsApp order notification.", {
      orderId,
      errorCode: code,
    });
    console.error("WhatsApp notification status write failed.", recordError);
  }

  console.error("WhatsApp order notification failed.", {
    orderId,
    errorCode: code,
  });
}

export async function sendOrderWhatsAppNotification(
  orderId: string,
  order: WhatsAppOrder
): Promise<void> {
  let notificationRef: FirebaseFirestore.DocumentReference | null = null;
  const now = Date.now();

  try {
    const currentNotificationRef = adminDb
      .collection("whatsappOrderNotifications")
      .doc(orderId);
    notificationRef = currentNotificationRef;
    const claim = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(currentNotificationRef);
      const previous = snapshot.exists ? snapshot.data()! : {};
      const currentClaim = getNotificationClaim(previous, now);
      if (!currentClaim.claimed) return currentClaim;

      transaction.set(
        currentNotificationRef,
        {
          orderId,
          status: "sending",
          attempts: (Number(previous.attempts) || 0) + 1,
          sentPartCount: currentClaim.sentPartCount,
          leaseExpiresAt: new Date(now + LEASE_DURATION_MS).toISOString(),
          retryAfter: null,
          updatedAt: new Date(now).toISOString(),
        },
        { merge: true }
      );
      return currentClaim;
    });

    if (!claim.claimed) return;

    const config = getWhatsAppCloudConfig();
    const messages = buildOrderWhatsAppMessages(order);
    await currentNotificationRef.set(
      { totalParts: messages.length, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    for (let index = claim.sentPartCount; index < messages.length; index += 1) {
      const messageId = await sendWhatsAppText(messages[index], config);
      await currentNotificationRef.update({
        sentPartCount: index + 1,
        ...(messageId
          ? {
              messageIds: admin.firestore.FieldValue.arrayUnion(messageId),
            }
          : {}),
        updatedAt: new Date().toISOString(),
      });
    }

    await currentNotificationRef.update({
      status: "sent",
      sentAt: new Date().toISOString(),
      leaseExpiresAt: null,
      retryAfter: null,
      lastErrorCode: null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (notificationRef) {
      await recordFailure(notificationRef, orderId, error);
    } else {
      console.error("Could not initialize WhatsApp order notification.", {
        orderId,
        errorCode: errorCode(error),
      });
    }
  }
}
