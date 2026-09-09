import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import {
  attachStripeSession,
  checkoutSchema,
  createOrder,
  OrderError,
} from "@/lib/orders.server";
import {
  createCheckoutSession,
  getStripeSecretKey,
  StripeConfigError,
} from "@/lib/stripe.server";

export const Route = createFileRoute("/api/checkout-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }

        const parsed = checkoutSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { error: parsed.error.issues[0]?.message ?? "Invalid checkout details" },
            { status: 400 },
          );
        }

        try {
          // Fail before touching stock if payments are not configured.
          getStripeSecretKey();

          // Prices, subtotal and total are recalculated from PostgreSQL here.
          const { order, items } = await createOrder(parsed.data);
          const origin = new URL(request.url).origin;




          const session = await createCheckoutSession({
            orderId: order["id"] as string,
            orderNumber: order["order_number"] as string,
            email: parsed.data.email,
            deliveryFee: Number(order["delivery_fee"] ?? 0),
            lines: items.map((i) => ({
              name: i.product_name,
              unit_price: i.unit_price,
              quantity: i.quantity,
            })),
            origin,
          });

          await attachStripeSession(order["id"] as string, session.id);

          if (!session.url) {
            return json({ error: "Could not start the payment session" }, { status: 502 });
          }

          return json(
            { url: session.url, order_number: order["order_number"] },
            { status: 201 },
          );
        } catch (err) {
          if (err instanceof OrderError) {
            return json({ error: err.message }, { status: err.status });
          }
          if (err instanceof StripeConfigError) {
            console.error("stripe config", err.message);
            return json({ error: "Payments are not configured yet." }, { status: 503 });
          }
          console.error("checkout session error", err);
          return json({ error: "Could not start checkout" }, { status: 500 });
        }
      },
    },
  },
});
