/**
 * Minimal, Worker-safe Stripe client. Uses fetch + form encoding instead of the
 * Node SDK so it runs unchanged in the edge runtime.
 */

const STRIPE_API = "https://api.stripe.com/v1";

export class StripeConfigError extends Error {}

export function getStripeSecretKey() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) {
    throw new StripeConfigError(
      "STRIPE_SECRET_KEY is not set on the server. Add it to the deployment environment variables.",
    );
  }
  return key;
}

/** Flattens a nested object into Stripe's bracketed form-encoding. */
function encode(value: unknown, prefix = "", out = new URLSearchParams()): URLSearchParams {
  if (value === undefined || value === null) return out;
  if (Array.isArray(value)) {
    value.forEach((v, i) => encode(v, `${prefix}[${i}]`, out));
    return out;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      encode(v, prefix ? `${prefix}[${k}]` : k, out);
    }
    return out;
  }
  out.append(prefix, String(value));
  return out;
}

async function stripeRequest<T>(
  path: string,
  body?: Record<string, unknown>,
  method: "GET" | "POST" = "POST",
): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    ...(body ? { body: encode(body).toString() } : {}),
  });
  const payload = (await res.json()) as {
    error?: { message?: string; code?: string; param?: string };
  };
  if (!res.ok) {
    // Log the provider detail server-side, surface a safe message.
    console.error("stripe error", path, payload.error);
    const err = new Error(payload.error?.message ?? "Payment provider request failed") as Error & {
      stripeParam?: string;
    };
    if (payload.error?.param) err.stripeParam = payload.error.param;
    throw err;
  }
  return payload as T;
}

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  status?: string;
  payment_status?: string;
  payment_intent?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  client_reference_id?: string | null;
  payment_method_types?: string[];
  metadata?: Record<string, string>;
};

export type CheckoutLine = {
  name: string;
  unit_price: number;
  quantity: number;
};

/**
 * Card + the buy-now-pay-later methods the salon offers. Stripe only renders a
 * method when the buyer, currency and account are eligible, so listing them is
 * safe; if the account has not activated one yet, session creation is retried
 * with the account's dashboard defaults instead of failing the purchase.
 */
const PAYMENT_METHOD_TYPES = ["card", "klarna", "afterpay_clearpay"];

async function createSession(params: {
  email: string;
  reference: string;
  lines: CheckoutLine[];
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}) {
  const line_items = params.lines.map((line) => ({
    quantity: line.quantity,
    price_data: {
      currency: "gbp",
      unit_amount: Math.round(line.unit_price * 100),
      product_data: { name: line.name },
    },
  }));

  const base: Record<string, unknown> = {
    mode: "payment",
    customer_email: params.email,
    client_reference_id: params.reference,
    billing_address_collection: "required",
    line_items,
    metadata: params.metadata,
    payment_intent_data: { metadata: params.metadata },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  };

  try {
    return await stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
      ...base,
      payment_method_types: PAYMENT_METHOD_TYPES,
    });
  } catch (err) {
    const param = (err as { stripeParam?: string }).stripeParam ?? "";
    if (!param.startsWith("payment_method_types")) throw err;
    // A BNPL method is not activated on the account — fall back to whatever the
    // Stripe dashboard has enabled so the customer can still pay by card.
    console.warn("stripe: falling back to dashboard payment methods", param);
    return await stripeRequest<StripeCheckoutSession>("/checkout/sessions", base);
  }
}

/** Hosted Stripe Checkout for a shop order. */
export async function createCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  email: string;
  lines: CheckoutLine[];
  deliveryFee: number;
  origin: string;
}) {
  const lines = [...params.lines];
  if (params.deliveryFee > 0) {
    lines.push({ name: "Delivery", unit_price: params.deliveryFee, quantity: 1 });
  }

  return await createSession({
    email: params.email,
    reference: params.orderNumber,
    lines,
    metadata: {
      kind: "order",
      order_id: params.orderId,
      order_number: params.orderNumber,
    },
    successUrl: `${params.origin}/order-success/${params.orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${params.origin}/checkout?cancelled=1`,
  });
}

/** Hosted Stripe Checkout for a service booking. */
export async function createBookingCheckoutSession(params: {
  bookingId: string;
  reference: string;
  email: string;
  /** One line per selected service — the customer pays for them together. */
  lines: CheckoutLine[];
  origin: string;
}) {
  return await createSession({
    email: params.email,
    reference: params.reference,
    lines: params.lines,
    metadata: {
      kind: "booking",
      booking_id: params.bookingId,
      booking_reference: params.reference,
    },
    successUrl: `${params.origin}/booking-success/${params.reference}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${params.origin}/book?cancelled=1`,
  });
}

export async function retrieveCheckoutSession(sessionId: string) {
  return await stripeRequest<StripeCheckoutSession>(
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
    undefined,
    "GET",
  );
}

/** Constant-time-ish comparison of two hex digests. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies a Stripe webhook signature (t=…,v1=…) using WebCrypto so it works
 * in the edge runtime.
 */
export async function verifyStripeSignature(payload: string, header: string | null) {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) throw new StripeConfigError("STRIPE_WEBHOOK_SECRET is not set on the server.");
  if (!header) return false;

  const parts = new Map(
    header.split(",").map((p) => {
      const [k, ...rest] = p.split("=");
      return [k?.trim() ?? "", rest.join("=").trim()];
    }),
  );
  const timestamp = parts.get("t");
  const signatures = header
    .split(",")
    .map((p) => p.split("="))
    .filter(([k]) => k?.trim() === "v1")
    .map(([, ...rest]) => rest.join("=").trim());
  if (!timestamp || signatures.length === 0) return false;

  // Reject replays older than 5 minutes.
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signatures.some((sig) => safeEqual(expected, sig));
}
