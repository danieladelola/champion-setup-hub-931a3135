import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orders.server";

const patchSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  payment_status: z.enum(PAYMENT_STATUSES).optional(),
});

export const Route = createFileRoute("/api/admin/orders/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        const rows = await sql`select * from orders where id = ${params.id} limit 1`;
        const order = rows[0];
        if (!order) return json({ error: "Order not found" }, { status: 404 });
        const items = await sql`
          select id, product_id, product_name, sku, unit_price, quantity, line_total
          from order_items where order_id = ${params.id} order by created_at`;
        return json({ order, items });
      },
      PATCH: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success || (!parsed.data.status && !parsed.data.payment_status)) {
          return json({ error: "Invalid status" }, { status: 400 });
        }
        const sql = getDb();
        const rows = await sql`
          update orders set
            status = coalesce(${parsed.data.status ?? null}, status),
            payment_status = coalesce(${parsed.data.payment_status ?? null}, payment_status),
            updated_at = now()
          where id = ${params.id}
          returning *`;
        if (!rows[0]) return json({ error: "Order not found" }, { status: 404 });
        return json({ order: rows[0] });
      },
    },
  },
});
