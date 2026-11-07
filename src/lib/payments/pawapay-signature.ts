import "server-only";

import {
  constants,
  createHash,
  timingSafeEqual,
  verify,
} from "node:crypto";

import {
  PawapayError,
  pawapayRequest,
} from "@/lib/payments/pawapay";
import type { PawapayConfig } from "@/lib/payments/pawapay";

type PawapayPublicKey = {
  id?: string;
  key?: string;
};

const requiredComponents = [
  "@method",
  "@authority",
  "@path",
  "signature-date",
  "content-digest",
  "content-type",
];

let publicKeysCache: { expiresAt: number; keys: PawapayPublicKey[] } | undefined;

function getHeaderValue(
  headers: Headers,
  name: string,
): string {
  const value = headers.get(name);
  if (!value) {
    throw new PawapayError(
      "PawaPay callback signature headers are incomplete.",
      "invalid_response",
    );
  }
  return value.trim();
}

async function getPawapayPublicKeys(config: PawapayConfig) {
  if (publicKeysCache && publicKeysCache.expiresAt > Date.now()) {
    return publicKeysCache.keys;
  }

  const keys = await pawapayRequest<PawapayPublicKey[]>(
    "/v2/public-key/http",
    {},
    config,
  );
  if (
    !Array.isArray(keys) ||
    keys.some(
      (key) =>
        !key ||
        typeof key.id !== "string" ||
        typeof key.key !== "string" ||
        !key.key.includes("BEGIN PUBLIC KEY"),
    )
  ) {
    throw new PawapayError(
      "PawaPay public keys are invalid.",
      "invalid_response",
    );
  }

  publicKeysCache = { keys, expiresAt: Date.now() + 5 * 60_000 };
  return keys;
}

function parseSignatureInput(value: string) {
  const match = /^([A-Za-z0-9_-]+)=\(([^)]*)\);(.+)$/.exec(value);
  if (!match) return null;

  const [, label, rawComponents, rawParameters] = match;
  const components = [...rawComponents.matchAll(/"([^"]+)"/g)].map(
    (component) => component[1].toLowerCase(),
  );
  const strippedComponents = rawComponents.replace(/"[^"]+"/g, "").trim();
  if (
    strippedComponents ||
    new Set(components).size !== components.length ||
    requiredComponents.some((component) => !components.includes(component)) ||
    components.some((component) => !requiredComponents.includes(component))
  ) {
    return null;
  }

  const algorithm = /(?:^|;)alg="([^"]+)"/.exec(rawParameters)?.[1];
  const keyId = /(?:^|;)keyid="([^"]+)"/.exec(rawParameters)?.[1];
  const created = Number(/(?:^|;)created=(\d+)/.exec(rawParameters)?.[1]);
  const expires = Number(/(?:^|;)expires=(\d+)/.exec(rawParameters)?.[1]);
  if (
    !algorithm ||
    !keyId ||
    !Number.isSafeInteger(created) ||
    !Number.isSafeInteger(expires) ||
    expires <= created
  ) {
    return null;
  }

  return {
    label,
    components,
    algorithm,
    keyId,
    created,
    expires,
    signatureParams: `(${rawComponents});${rawParameters}`,
  };
}

function normalizeHeader(value: string) {
  return value.trim().replace(/[ \t]+/g, " ");
}

function createSignatureBase(
  request: Request,
  headers: Headers,
  components: string[],
  signatureParams: string,
) {
  const requestUrl = new URL(request.url);
  const authority = getHeaderValue(headers, "host").toLowerCase();
  const values: Record<string, string> = {
    "@method": request.method.toUpperCase(),
    "@authority": authority,
    "@path": requestUrl.pathname,
    "signature-date": normalizeHeader(getHeaderValue(headers, "signature-date")),
    "content-digest": normalizeHeader(getHeaderValue(headers, "content-digest")),
    "content-type": normalizeHeader(getHeaderValue(headers, "content-type")),
  };

  return [
    ...components.map((component) => `"${component}": ${values[component]}`),
    `"@signature-params": ${signatureParams}`,
  ].join("\n");
}

function verifySignature(
  algorithm: string,
  publicKey: string,
  signatureBase: string,
  signature: Buffer,
) {
  switch (algorithm) {
    case "ecdsa-p256-sha256":
    case "rsa-v1_5-sha256":
      return verify("sha256", Buffer.from(signatureBase), publicKey, signature);
    case "ecdsa-p384-sha384":
      return verify("sha384", Buffer.from(signatureBase), publicKey, signature);
    case "rsa-pss-sha512":
      return verify(
        "sha512",
        Buffer.from(signatureBase),
        {
          key: publicKey,
          padding: constants.RSA_PKCS1_PSS_PADDING,
          saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
        },
        signature,
      );
    default:
      return false;
  }
}

export async function verifyPawapayCallbackSignature(
  request: Request,
  rawBody: string,
  config: PawapayConfig,
) {
  const headers = request.headers;
  const signatureInput = parseSignatureInput(
    getHeaderValue(headers, "signature-input"),
  );
  const signatureHeader = new RegExp(
    `^${signatureInput?.label || "invalid"}=:([A-Za-z0-9+/]+={0,2}):$`,
  ).exec(getHeaderValue(headers, "signature"));
  const contentDigest = /^(sha-256|sha-512)=:([A-Za-z0-9+/]+={0,2}):$/i.exec(
    getHeaderValue(headers, "content-digest"),
  );
  const signatureDate = Date.parse(getHeaderValue(headers, "signature-date"));
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (
    !signatureInput ||
    !signatureHeader ||
    !contentDigest ||
    !Number.isFinite(signatureDate) ||
    Math.abs(signatureDate / 1000 - signatureInput.created) > 300 ||
    signatureInput.created > nowSeconds + 300 ||
    signatureInput.expires < nowSeconds - 300
  ) {
    return false;
  }

  const digestAlgorithm =
    contentDigest[1].toLowerCase() === "sha-256" ? "sha256" : "sha512";
  const expectedDigest = Buffer.from(contentDigest[2], "base64");
  const actualDigest = createHash(digestAlgorithm).update(rawBody).digest();
  if (
    expectedDigest.length !== actualDigest.length ||
    !timingSafeEqual(expectedDigest, actualDigest)
  ) {
    return false;
  }

  const keys = await getPawapayPublicKeys(config);
  const publicKey = keys.find((key) => key.id === signatureInput.keyId)?.key;
  if (!publicKey) return false;

  try {
    return verifySignature(
      signatureInput.algorithm,
      publicKey,
      createSignatureBase(
        request,
        headers,
        signatureInput.components,
        signatureInput.signatureParams,
      ),
      Buffer.from(signatureHeader[1], "base64"),
    );
  } catch {
    return false;
  }
}
