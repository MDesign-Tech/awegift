import "server-only";

export type PawapayEnvironment = "sandbox" | "production";

export type PawapayConfig = {
  environment: PawapayEnvironment;
  apiBaseUrl: string;
  token: string;
  callbackUrl?: string;
};

export class PawapayError extends Error {
  constructor(
    message: string,
    readonly code: "configuration" | "network" | "http" | "invalid_response",
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "PawapayError";
  }
}

export function getPawapayConfig(
  env: NodeJS.ProcessEnv = process.env,
): PawapayConfig {
  const environment = env.PAWAPAY_ENV || "sandbox";
  const token = env.PAWAPAY_API_TOKEN?.trim();
  const expectedBaseUrl =
    environment === "sandbox"
      ? "https://api.sandbox.pawapay.io"
      : "https://api.pawapay.io";

  if (environment !== "sandbox" && environment !== "production") {
    throw new PawapayError(
      "PAWAPAY_ENV must be sandbox or production.",
      "configuration",
    );
  }
  if (!token) {
    throw new PawapayError("PawaPay API token is not configured.", "configuration");
  }

  const configuredBaseUrl = env.PAWAPAY_BASE_URL?.trim() || expectedBaseUrl;
  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredBaseUrl);
  } catch {
    throw new PawapayError("PAWAPAY_BASE_URL is invalid.", "configuration");
  }
  if (
    baseUrl.origin !== expectedBaseUrl ||
    (baseUrl.pathname !== "/" && baseUrl.pathname !== "") ||
    baseUrl.search ||
    baseUrl.hash ||
    baseUrl.username ||
    baseUrl.password
  ) {
    throw new PawapayError(
      "PAWAPAY_BASE_URL does not match PAWAPAY_ENV.",
      "configuration",
    );
  }

  const callbackUrl = env.PAWAPAY_CALLBACK_URL?.trim();
  if (callbackUrl) {
    let parsedCallbackUrl: URL;
    try {
      parsedCallbackUrl = new URL(callbackUrl);
    } catch {
      throw new PawapayError("PAWAPAY_CALLBACK_URL is invalid.", "configuration");
    }
    if (
      parsedCallbackUrl.protocol !== "https:" ||
      parsedCallbackUrl.username ||
      parsedCallbackUrl.password ||
      parsedCallbackUrl.search ||
      parsedCallbackUrl.hash
    ) {
      throw new PawapayError(
        "PAWAPAY_CALLBACK_URL must be a public HTTPS URL without query parameters.",
        "configuration",
      );
    }
  }

  return {
    environment,
    apiBaseUrl: baseUrl.origin,
    token,
    callbackUrl,
  };
}

export function getPawapaySiteOrigin(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configuredUrl = env.NEXTAUTH_URL?.trim();
  if (!configuredUrl) {
    throw new PawapayError("NEXTAUTH_URL is not configured.", "configuration");
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new PawapayError("NEXTAUTH_URL is invalid.", "configuration");
  }

  const localHttp =
    env.NODE_ENV !== "production" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (
    (url.protocol !== "https:" && !(localHttp && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new PawapayError("NEXTAUTH_URL must be a secure site origin.", "configuration");
  }

  return url.origin;
}

export function validatePawapayRedirectUrl(
  value: string,
  environment: PawapayEnvironment,
): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new PawapayError("PawaPay returned an invalid checkout URL.", "invalid_response");
  }

  const expectedHost =
    environment === "sandbox"
      ? "checkout.sandbox.pawapay.io"
      : "checkout.pawapay.io";
  if (
    url.protocol !== "https:" ||
    url.hostname !== expectedHost ||
    url.username ||
    url.password
  ) {
    throw new PawapayError("PawaPay returned an untrusted checkout URL.", "invalid_response");
  }
  return url.toString();
}

export async function pawapayRequest<T>(
  path: string,
  init: RequestInit = {},
  config: PawapayConfig = getPawapayConfig(),
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(new URL(path, config.apiBaseUrl), {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.token}`,
        ...init.headers,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new PawapayError(
        `PawaPay API request failed with HTTP ${response.status}.`,
        "http",
        response.status,
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new PawapayError(
        "PawaPay returned an invalid response.",
        "invalid_response",
        response.status,
      );
    }
    return data as T;
  } catch (error) {
    if (error instanceof PawapayError) throw error;
    if (controller.signal.aborted) {
      throw new PawapayError("PawaPay API request timed out.", "network");
    }
    throw new PawapayError("PawaPay API request could not be completed.", "network");
  } finally {
    clearTimeout(timeout);
  }
}

export function isMatchingPawapayAmount(
  actualAmount: unknown,
  actualCurrency: unknown,
  expectedAmount: number,
  expectedCurrency: string,
): boolean {
  const amount = Number(actualAmount);
  return (
    Number.isFinite(amount) &&
    Math.round(amount * 100) === Math.round(expectedAmount * 100) &&
    typeof actualCurrency === "string" &&
    actualCurrency.toUpperCase() === expectedCurrency.toUpperCase()
  );
}
