import "server-only";

export interface WhatsAppCloudConfig {
  accessToken: string;
  phoneNumberId: string;
  recipientPhone: string;
  graphApiVersion: string;
}

export class WhatsAppCloudApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus?: number,
    readonly retryable = false
  ) {
    super(message);
    this.name = "WhatsAppCloudApiError";
  }
}

export function normalizeWhatsAppPhoneNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("0")
    ? `250${digits.slice(1)}`
    : digits;
  return /^2507\d{8}$/.test(normalized) ? normalized : null;
}

export function getWhatsAppCloudConfig(
  env: Record<string, string | undefined> = process.env
): WhatsAppCloudConfig {
  const accessToken = env.WHATSAPP_CLOUD_API_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const recipientPhone = normalizeWhatsAppPhoneNumber(
    env.WHATSAPP_RECIPIENT_PHONE?.trim() || "0781990310"
  );
  const graphApiVersion =
    env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v23.0";

  if (!accessToken || !phoneNumberId || !recipientPhone) {
    throw new WhatsAppCloudApiError(
      "WhatsApp Cloud API configuration is incomplete."
    );
  }
  if (!/^v\d+\.\d+$/.test(graphApiVersion)) {
    throw new WhatsAppCloudApiError(
      "WhatsApp Graph API version is invalid."
    );
  }

  return { accessToken, phoneNumberId, recipientPhone, graphApiVersion };
}

interface WhatsAppSendOptions {
  fetchImpl?: typeof fetch;
  wait?: (milliseconds: number) => Promise<void>;
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export async function sendWhatsAppText(
  message: string,
  config: WhatsAppCloudConfig,
  options: WhatsAppSendOptions = {}
): Promise<string | null> {
  const fetchImpl = options.fetchImpl || fetch;
  const wait = options.wait || delay;
  const url = `https://graph.facebook.com/${config.graphApiVersion}/${encodeURIComponent(config.phoneNumberId)}/messages`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: config.recipientPhone,
          type: "text",
          text: { preview_url: false, body: message },
        }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });

      if (!response.ok) {
        const retryable =
          response.status === 408 ||
          response.status === 429 ||
          response.status >= 500;
        if (retryable && attempt < 3) {
          await wait(attempt * 500);
          continue;
        }
        throw new WhatsAppCloudApiError(
          "WhatsApp Cloud API rejected the message.",
          response.status,
          retryable
        );
      }

      const data = await response.json().catch(() => null);
      const messageId =
        data &&
        typeof data === "object" &&
        Array.isArray(data.messages) &&
        typeof data.messages[0]?.id === "string"
          ? data.messages[0].id
          : null;
      return messageId;
    } catch (error) {
      if (error instanceof WhatsAppCloudApiError) throw error;
      if (attempt === 3) {
        throw new WhatsAppCloudApiError(
          "WhatsApp Cloud API request failed after retries.",
          undefined,
          true
        );
      }
      await wait(attempt * 500);
    }
  }

  throw new WhatsAppCloudApiError("WhatsApp Cloud API request failed.");
}
