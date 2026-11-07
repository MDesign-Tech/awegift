import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { afterEach, test } from "node:test";

import {
  getPawapayConfig,
  getPawapaySiteOrigin,
  isMatchingPawapayAmount,
  PawapayError,
  pawapayRequest,
  validatePawapayRedirectUrl,
} from "../../src/lib/payments/pawapay";
import {
  getRwandaPawapayProviders,
  normalizeRwandaPhoneNumber,
  predictRwandaPawapayPhone,
} from "../../src/lib/payments/pawapay-deposit";
import {
  verifyPawapayCallbackSignature,
} from "../../src/lib/payments/pawapay-signature";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("configuration requires an API token and recognized environment", () => {
  assert.throws(
    () => getPawapayConfig({ ...process.env, PAWAPAY_API_TOKEN: "", PAWAPAY_ENV: "sandbox" }),
    (error: unknown) =>
      error instanceof PawapayError && error.code === "configuration",
  );
  assert.throws(
    () =>
      getPawapayConfig({
        ...process.env,
        PAWAPAY_API_TOKEN: "test-token",
        PAWAPAY_ENV: "staging",
      }),
    (error: unknown) =>
      error instanceof PawapayError && error.code === "configuration",
  );
});

test("selects the environment-specific API and validates the merchant origin", () => {
  assert.equal(
    getPawapayConfig({
      ...process.env,
      PAWAPAY_API_TOKEN: "sandbox-token",
      PAWAPAY_ENV: "sandbox",
    }).apiBaseUrl,
    "https://api.sandbox.pawapay.io",
  );
  assert.equal(
    getPawapayConfig({
      ...process.env,
      PAWAPAY_API_TOKEN: "live-token",
      PAWAPAY_ENV: "production",
    }).apiBaseUrl,
    "https://api.pawapay.io",
  );
  assert.equal(
    getPawapaySiteOrigin({
      NEXTAUTH_URL: "https://aweegift.com/",
      NODE_ENV: "production",
    }),
    "https://aweegift.com",
  );
  assert.throws(
    () =>
      getPawapaySiteOrigin({
        NEXTAUTH_URL: "http://aweegift.com",
        NODE_ENV: "production",
      }),
    (error: unknown) =>
      error instanceof PawapayError && error.code === "configuration",
  );
  assert.throws(
    () =>
      getPawapayConfig({
        ...process.env,
        PAWAPAY_API_TOKEN: "sandbox-token",
        PAWAPAY_ENV: "sandbox",
        PAWAPAY_BASE_URL: "https://api.pawapay.io",
      }),
    (error: unknown) =>
      error instanceof PawapayError && error.code === "configuration",
  );
});

test("accepts only PawaPay's hosted checkout origin for the selected environment", () => {
  assert.equal(
    validatePawapayRedirectUrl(
      "https://checkout.sandbox.pawapay.io/checkout-code",
      "sandbox",
    ),
    "https://checkout.sandbox.pawapay.io/checkout-code",
  );
  assert.throws(
    () =>
      validatePawapayRedirectUrl(
        "https://checkout.pawapay.io/checkout-code",
        "sandbox",
      ),
    (error: unknown) =>
      error instanceof PawapayError && error.code === "invalid_response",
  );
  assert.throws(
    () =>
      validatePawapayRedirectUrl(
        "https://example.test/checkout-code",
        "production",
      ),
    (error: unknown) =>
      error instanceof PawapayError && error.code === "invalid_response",
  );
});

test("PawaPay requests use bearer authentication and reject HTTP failures", async () => {
  let authorization = "";
  globalThis.fetch = async (_input, init) => {
    authorization = new Headers(init?.headers).get("Authorization") || "";
    return Response.json({ status: "FOUND" });
  };
  const config = {
    environment: "sandbox" as const,
    apiBaseUrl: "https://api.sandbox.pawapay.io",
    token: "test-token",
  };

  const response = await pawapayRequest<{ status?: string }>(
    "/v2/checkouts/test-id",
    {},
    config,
  );
  assert.equal(response.status, "FOUND");
  assert.equal(authorization, "Bearer test-token");

  globalThis.fetch = async () => new Response("", { status: 401 });
  await assert.rejects(
    pawapayRequest("/v2/checkouts/test-id", {}, config),
    (error: unknown) =>
      error instanceof PawapayError &&
      error.code === "http" &&
      error.httpStatus === 401,
  );
});

test("discovers providers from active configuration object and array operation formats", async () => {
  const config = getPawapayConfig({
    ...process.env,
    PAWAPAY_API_TOKEN: "sandbox-token",
    PAWAPAY_ENV: "sandbox",
  });
  const activeConfiguration = {
    countries: [
      {
        country: "RWA",
        providers: [
          {
            provider: "MTN_MOMO_RWA",
            currencies: [
              {
                currency: "RWF",
                operationTypes: {
                  DEPOSIT: {
                    minAmount: "5",
                    maxAmount: "2000000",
                    status: "OPERATIONAL",
                  },
                },
              },
            ],
          },
          {
            provider: "AIRTEL_RWA",
            currencies: [
              {
                currency: "RWF",
                operationTypes: [
                  {
                    DEPOSIT: {
                      minTransactionLimit: "100",
                      maxTransactionLimit: "1500000",
                      status: "DELAYED",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  globalThis.fetch = async () => Response.json(activeConfiguration);

  assert.deepEqual(await getRwandaPawapayProviders(config), [
    {
      provider: "MTN_MOMO_RWA",
      displayName: "MTN MoMo",
      minimumAmount: 5,
      maximumAmount: 2_000_000,
      status: "OPERATIONAL",
    },
    {
      provider: "AIRTEL_RWA",
      displayName: "Airtel Money",
      minimumAmount: 100,
      maximumAmount: 1_500_000,
      status: "DELAYED",
    },
  ]);
});

test("payment amounts must match exactly in currency and minor-unit precision", () => {
  assert.equal(isMatchingPawapayAmount("1250.00", "RWF", 1250, "RWF"), true);
  assert.equal(isMatchingPawapayAmount("1250.01", "RWF", 1250, "RWF"), false);
  assert.equal(isMatchingPawapayAmount("1250", "USD", 1250, "RWF"), false);
  assert.equal(isMatchingPawapayAmount("invalid", "RWF", 1250, "RWF"), false);
});

test("normalizes valid Rwanda mobile phone number formats", () => {
  assert.equal(normalizeRwandaPhoneNumber("078 123 4567"), "250781234567");
  assert.equal(normalizeRwandaPhoneNumber("+250 781 234 567"), "250781234567");
  assert.equal(normalizeRwandaPhoneNumber("250781234567"), "250781234567");
  assert.equal(normalizeRwandaPhoneNumber("07812345"), null);
  assert.equal(normalizeRwandaPhoneNumber("123456789"), null);
});

test("validates the phone against PawaPay's provider-prediction endpoint", async () => {
  let requestUrl = "";
  let requestBody = "";
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestBody = String(init?.body);
    return Response.json({
      country: "RWA",
      provider: "MTN_MOMO_RWA",
      phoneNumber: "250781234567",
    });
  };
  const config = {
    environment: "sandbox" as const,
    apiBaseUrl: "https://api.sandbox.pawapay.io",
    token: "test-token",
  };

  assert.deepEqual(
    await predictRwandaPawapayPhone("250781234567", config),
    {
      country: "RWA",
      provider: "MTN_MOMO_RWA",
      phoneNumber: "250781234567",
    },
  );
  assert.equal(
    requestUrl,
    "https://api.sandbox.pawapay.io/v2/predict-provider",
  );
  assert.equal(requestBody, JSON.stringify({ phoneNumber: "250781234567" }));
});

test("verifies PawaPay RFC 9421 signed callbacks and rejects changed bodies", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  const rawBody = JSON.stringify({
    depositId: "e14a3fcf-5a77-4f82-b313-77d253be0612",
    status: "COMPLETED",
  });
  const created = Math.floor(Date.now() / 1000);
  const expires = created + 60;
  const signatureDate = new Date(created * 1000).toISOString();
  const contentDigest = `sha-512=:${createHash("sha512").update(rawBody).digest("base64")}:`;
  const signatureParams =
    '("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="ecdsa-p256-sha256";keyid="TEST_KEY";created=' +
    created +
    ";expires=" +
    expires;
  const signatureBase = [
    '"@method": POST',
    '"@authority": aweegift.com',
    '"@path": /api/payments/pawapay/callback',
    `"signature-date": ${signatureDate}`,
    `"content-digest": ${contentDigest}`,
    '"content-type": application/json; charset=UTF-8',
    `"@signature-params": ${signatureParams}`,
  ].join("\n");
  const signature = sign("sha256", Buffer.from(signatureBase), privateKey).toString(
    "base64",
  );

  globalThis.fetch = async () =>
    Response.json([
      {
        id: "TEST_KEY",
        key: publicKey.export({ type: "spki", format: "pem" }).toString(),
      },
    ]);

  const request = new Request("https://aweegift.com/api/payments/pawapay/callback", {
    method: "POST",
    headers: {
      host: "aweegift.com",
      "content-type": "application/json; charset=UTF-8",
      "content-digest": contentDigest,
      "signature-date": signatureDate,
      "signature-input": `sig-pp=${signatureParams}`,
      signature: `sig-pp=:${signature}:`,
    },
    body: rawBody,
  });
  const config = {
    environment: "production" as const,
    apiBaseUrl: "https://api.pawapay.io",
    token: "test-token",
  };

  assert.equal(
    await verifyPawapayCallbackSignature(request, rawBody, config),
    true,
  );
  assert.equal(
    await verifyPawapayCallbackSignature(request, `${rawBody} `, config),
    false,
  );
});
