import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/admin/messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          const sql = getDb();
          const messages = await sql`
            select m.id, m.full_name, m.email, m.phone, m.subject, m.message, m.read, m.created_at,
                   (select count(*)::int from orders o where lower(o.email) = lower(m.email)) as order_count,
                   (select count(*)::int from bookings b where lower(b.email) = lower(m.email)) as booking_count,
                   (select c.city from customers c where lower(c.email) = lower(m.email) limit 1) as city,
                   (select c.country from customers c where lower(c.email) = lower(m.email) limit 1) as country
            from messages m
            order by m.created_at desc
            limit 300`;
          return json({ messages });
        } catch (error) {
          console.error("GET /api/admin/messages failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
      },
    },
  },
});
