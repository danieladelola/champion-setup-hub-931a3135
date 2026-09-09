import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/admin/customers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          const sql = getDb();
          const customers = await sql`
            select c.id, c.full_name, c.first_name, c.last_name, c.email, c.phone,
                   c.city, c.state, c.country, c.postcode, c.address, c.notes, c.source, c.created_at,
                   (select count(*)::int from orders o where lower(o.email) = lower(c.email)) as order_count,
                   (select coalesce(sum(o.total), 0) from orders o where lower(o.email) = lower(c.email)) as total_spent,
                   (select count(*)::int from bookings b where lower(b.email) = lower(c.email)) as booking_count
            from customers c
            order by c.created_at desc
            limit 1000`;
          return json({ customers });
        } catch (error) {
          console.error("GET /api/admin/customers failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
      },
    },
  },
});
