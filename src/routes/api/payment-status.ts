import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { markBookingPaid, expireBooking } from "@/lib/bookings.server";
import { expireStripeOrder, markOrderPaid } from "@/lib/orders.server";
import {
  retrieveCheckoutSession,
  StripeConfigError,
} from "@/lib/stripe.server";

/**
 * Confirmation-page fallback: asks Stripe directly whether a Checkout session
 * was paid and syncs the order/booking. Safe to call repeatedly — the database
 * updates are idempotent — and it keeps confirmation correct even if the
 * webhook is delayed.
 */
export const Route = createFileRoute("/api/payment-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sessionId = new URL(request.url).searchParams.get("session_id");
        if (!sessionId || !sessionId.startsWith("cs_")) {
          return json({ error: "Missing session" }, { status: 400 });
        }

        try {
          const session = await retrieveCheckoutSession(sessionId);
          const kind = session.metadata?.["kind"] ?? "order";
          const paid = session.payment_status === "paid";
          const method = session.payment_method_types?.[0] ?? null;
          const intent =
            typeof session.payment_intent === "string" ? session.payment_intent : null;

          if (paid) {
            if (kind === "booking") {
              await markBookingPaid({
                sessionId,
                paymentIntentId: intent,
                paymentMethod: method,
                reference:
                  session.client_reference_id ??
                  session.metadata?.["booking_reference"] ??
                  null,
              });
            } else {
              await markOrderPaid({
                sessionId,
                paymentIntentId: intent,
                paymentMethod: method,
                orderNumber:
                  session.client_reference_id ?? session.metadata?.["order_number"] ?? null,
              });
            }
          } else if (session.status === "expired") {
            if (kind === "booking") await expireBooking(sessionId);
            else await expireStripeOrder(sessionId);
          }

          return json({
            paid,
            kind,
            pending: !paid && session.status !== "expired",
            payment_status: session.payment_status ?? "unpaid",
          });
        } catch (err) {
          if (err instanceof StripeConfigError) {
            return json({ error: "Payments are not configured yet." }, { status: 503 });
          }
          console.error("payment status check failed", err);
          return json({ error: "Could not verify the payment" }, { status: 502 });
        }
      },
    },
  },
});
