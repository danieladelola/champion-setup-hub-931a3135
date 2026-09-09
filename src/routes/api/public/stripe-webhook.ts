import { createFileRoute } from "@tanstack/react-router";

import { expireBooking, markBookingPaid } from "@/lib/bookings.server";
import { expireStripeOrder, markOrderPaid } from "@/lib/orders.server";
import { StripeConfigError, verifyStripeSignature } from "@/lib/stripe.server";

type StripeSessionEvent = {
  type: string;
  data: {
    object: {
      id: string;
      payment_status?: string;
      payment_intent?: string | null;
      client_reference_id?: string | null;
      payment_method_types?: string[];
      metadata?: Record<string, string>;
    };
  };
};

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();

        let valid = false;
        try {
          valid = await verifyStripeSignature(raw, request.headers.get("stripe-signature"));
        } catch (err) {
          if (err instanceof StripeConfigError) {
            console.error("stripe webhook config", err.message);
            return new Response("Webhook not configured", { status: 503 });
          }
          throw err;
        }
        if (!valid) return new Response("Invalid signature", { status: 401 });

        let event: StripeSessionEvent;
        try {
          event = JSON.parse(raw) as StripeSessionEvent;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const session = event.data?.object;
        if (!session?.id) return new Response("ok");
        const isBooking = session.metadata?.["kind"] === "booking";
        const intent =
          typeof session.payment_intent === "string" ? session.payment_intent : null;

        try {
          switch (event.type) {
            // Card completes immediately; Klarna and Clearpay can settle
            // asynchronously and arrive as async_payment_succeeded.
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded": {
              if (
                event.type === "checkout.session.completed" &&
                session.payment_status !== "paid"
              ) {
                // Pay-later still pending — wait for the async success event.
                break;
              }
              const paymentMethod = session.payment_method_types?.[0] ?? null;
              if (isBooking) {
                await markBookingPaid({
                  sessionId: session.id,
                  paymentIntentId: intent,
                  paymentMethod,
                  reference:
                    session.client_reference_id ??
                    session.metadata?.["booking_reference"] ??
                    null,
                });
              } else {
                await markOrderPaid({
                  sessionId: session.id,
                  paymentIntentId: intent,
                  paymentMethod,
                  orderNumber:
                    session.client_reference_id ?? session.metadata?.["order_number"] ?? null,
                });
              }
              break;
            }
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed": {
              if (isBooking) await expireBooking(session.id);
              else await expireStripeOrder(session.id);
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error("stripe webhook handling failed", err);
          // 500 makes Stripe retry the delivery.
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
