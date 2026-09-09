import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { checkoutSchema, createOrder, OrderError } from "@/lib/orders.server";

export const Route = createFileRoute("/api/orders")({
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
          const { order, items } = await createOrder(parsed.data);
          return json({ order, items }, { status: 201 });
        } catch (err) {
          if (err instanceof OrderError) {
            return json({ error: err.message }, { status: err.status });
          }
          console.error("order error", err);
          return json({ error: "Could not place the order" }, { status: 500 });
        }
      },
    },
  },
});
