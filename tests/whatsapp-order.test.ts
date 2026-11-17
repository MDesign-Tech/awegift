import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  getWhatsAppCloudConfig,
  normalizeWhatsAppPhoneNumber,
  sendWhatsAppText,
  WhatsAppCloudApiError,
} from "../src/lib/whatsapp/cloud-api";
import { getNotificationClaim } from "../src/lib/whatsapp/notification-claim";
import {
  buildOrderWhatsAppMessages,
  WHATSAPP_MAX_MESSAGE_LENGTH,
} from "../src/lib/whatsapp/order-message";
import {
  isAlreadyExistingOrderError,
  isSameOrderIntent,
  isValidOrderId,
} from "../src/lib/orders/order-idempotency";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const order = {
  id: "ORD-test-order",
  createdAt: "2026-11-16T08:30:00.000Z",
  status: "pending",
  paymentMethod: "pawapay",
  paymentStatus: "pending",
  customerName: "Test Customer",
  customerPhone: "0781234567",
  customerEmail: "customer@example.com",
  deliveryMethod: "Delivery",
  orderAddress: { address: "Kigali" },
  customerNotes: "Call on arrival",
  items: [
    { title: "Gift Box", price: 2500, quantity: 2 },
    { title: "Greeting Card", price: 500, quantity: 1 },
  ],
  subtotal: 5500,
  deliveryFee: 1000,
  discount: 500,
  totalAmount: 6000,
  currency: "RWF",
};

test("formats pending orders and includes every item and payment field", () => {
  const [message] = buildOrderWhatsAppMessages(order);

  assert.match(message, /Order Status: pending/);
  assert.match(message, /Payment Status: pending/);
  assert.match(message, /Delivery Address: Kigali/);
  assert.match(message, /Gift Box/);
  assert.match(message, /Quantity: 2/);
  assert.match(message, /Greeting Card/);
  assert.match(message, /Delivery Fee: 1,000 RWF/);
  assert.match(message, /Discount: 500 RWF/);
  assert.match(message, /Total Amount: 6,000 RWF/);

  const [failedPaymentMessage] = buildOrderWhatsAppMessages({
    ...order,
    paymentStatus: "failed",
  });
  assert.match(failedPaymentMessage, /Payment Status: failed/);
});

test("splits large multi-item messages without dropping order items", () => {
  const items = Array.from({ length: 50 }, (_, index) => ({
    title: `Product ${index + 1} ${"x".repeat(180)}`,
    price: 100,
    quantity: index + 1,
  }));
  const messages = buildOrderWhatsAppMessages({ ...order, items });
  const allText = messages.join("\n");

  assert.ok(messages.length > 1);
  assert.ok(messages.every((message) => message.length <= WHATSAPP_MAX_MESSAGE_LENGTH));
  for (let index = 1; index <= items.length; index += 1) {
    assert.ok(allText.includes(`Product ${index} `));
  }
});

test("normalizes the configured Rwandan destination and requires credentials", () => {
  assert.equal(normalizeWhatsAppPhoneNumber("0781 990 310"), "250781990310");
  assert.equal(normalizeWhatsAppPhoneNumber("+250781990310"), "250781990310");
  assert.equal(normalizeWhatsAppPhoneNumber("12345"), null);
  assert.deepEqual(
    getWhatsAppCloudConfig({
      WHATSAPP_CLOUD_API_ACCESS_TOKEN: "test-token",
      WHATSAPP_PHONE_NUMBER_ID: "123",
    }),
    {
      accessToken: "test-token",
      phoneNumberId: "123",
      recipientPhone: "250781990310",
      graphApiVersion: "v23.0",
    }
  );
  assert.throws(
    () => getWhatsAppCloudConfig({}),
    (error: unknown) =>
      error instanceof WhatsAppCloudApiError && !error.retryable
  );
});

test("sends authenticated WhatsApp text and returns the provider message ID", async () => {
  let requestUrl = "";
  let requestBody: Record<string, unknown> = {};
  let authorization = "";
  const fetchImpl: typeof fetch = async (input, init) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body));
    authorization = new Headers(init?.headers).get("Authorization") || "";
    return Response.json({ messages: [{ id: "wamid.test" }] });
  };
  const config = getWhatsAppCloudConfig({
    WHATSAPP_CLOUD_API_ACCESS_TOKEN: "private-token",
    WHATSAPP_PHONE_NUMBER_ID: "123",
  });

  assert.equal(
    await sendWhatsAppText("Order created", config, {
      fetchImpl,
      wait: async () => {},
    }),
    "wamid.test"
  );
  assert.equal(requestUrl, "https://graph.facebook.com/v23.0/123/messages");
  assert.equal(authorization, "Bearer private-token");
  assert.equal(requestBody.to, "250781990310");
  assert.equal(requestBody.messaging_product, "whatsapp");
});

test("retries temporary Cloud API failures but not permanent rejections", async () => {
  let attempts = 0;
  const waitCalls: number[] = [];
  const config = getWhatsAppCloudConfig({
    WHATSAPP_CLOUD_API_ACCESS_TOKEN: "private-token",
    WHATSAPP_PHONE_NUMBER_ID: "123",
  });
  const fetchImpl: typeof fetch = async () => {
    attempts += 1;
    return attempts < 3
      ? new Response("", { status: 503 })
      : Response.json({ messages: [{ id: "wamid.retry" }] });
  };

  assert.equal(
    await sendWhatsAppText("Order created", config, {
      fetchImpl,
      wait: async (milliseconds) => {
        waitCalls.push(milliseconds);
      },
    }),
    "wamid.retry"
  );
  assert.equal(attempts, 3);
  assert.deepEqual(waitCalls, [500, 1000]);

  attempts = 0;
  await assert.rejects(
    sendWhatsAppText(
      "Order created",
      config,
      {
        fetchImpl: async () => {
          attempts += 1;
          return new Response("", { status: 400 });
        },
        wait: async () => {},
      }
    ),
    (error: unknown) =>
      error instanceof WhatsAppCloudApiError &&
      error.httpStatus === 400 &&
      !error.retryable
  );
  assert.equal(attempts, 1);
});

test("notification claims suppress sent, active, and backoff retries", () => {
  const now = Date.parse("2026-11-16T08:00:00.000Z");
  assert.deepEqual(getNotificationClaim({ status: "sent" }, now), {
    claimed: false,
    sentPartCount: 0,
  });
  assert.equal(
    getNotificationClaim(
      {
        status: "sending",
        leaseExpiresAt: new Date(now + 60_000).toISOString(),
      },
      now
    ).claimed,
    false
  );
  assert.equal(
    getNotificationClaim(
      { status: "failed", retryAfter: new Date(now + 60_000).toISOString() },
      now
    ).claimed,
    false
  );
  assert.deepEqual(
    getNotificationClaim(
      { status: "failed", retryAfter: new Date(now - 1).toISOString(), sentPartCount: 1 },
      now
    ),
    { claimed: true, sentPartCount: 1 }
  );
});

test("order idempotency accepts only the same user's matching order intent", () => {
  const firstOrder = {
    userId: "user-1",
    items: [{ productId: "product-1", quantity: 2 }],
    orderAddress: { address: "Kigali" },
  };

  assert.equal(isValidOrderId("ORD-123-ABC"), true);
  assert.equal(isValidOrderId("bad/id"), false);
  assert.equal(isAlreadyExistingOrderError({ code: 6 }), true);
  assert.equal(isAlreadyExistingOrderError({ code: "permission-denied" }), false);
  assert.equal(isSameOrderIntent(firstOrder, { ...firstOrder }), true);
  assert.equal(
    isSameOrderIntent(firstOrder, { ...firstOrder, userId: "user-2" }),
    false
  );
  assert.equal(
    isSameOrderIntent(firstOrder, {
      ...firstOrder,
      items: [{ productId: "product-1", quantity: 3 }],
    }),
    false
  );
});
