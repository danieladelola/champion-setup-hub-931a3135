import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const url = new URL(request.url);
        const status = (url.searchParams.get("status") ?? "").trim();
        const sql = getDb();
        const orders = await sql`
          select id, order_number, customer_name, first_name, last_name, email, phone,
                 total, status, payment_status, created_at
          from orders
          where (${status === ""} or status = ${status})
          order by created_at desc
          limit 200`;
        return json({ orders });
      },
    },
  },
});
