import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/orders/$orderNumber")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const sql = getDb();
        const rows = await sql`
          select id, order_number, first_name, last_name, subtotal, delivery_fee, total,
                 status, payment_status, created_at
          from orders where order_number = ${params.orderNumber} limit 1`;
        const order = rows[0];
        if (!order) return json({ error: "Order not found" }, { status: 404 });
        const items = await sql`
          select product_name, sku, unit_price, quantity, line_total
          from order_items where order_id = ${order['id'] as string} order by created_at`;
        return json({ order, items });
      },
    },
  },
});
