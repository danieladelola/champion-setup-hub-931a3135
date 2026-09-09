import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/admin/bookings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          const sql = getDb();
          const bookings = await sql`
            select b.id, b.booking_reference, b.full_name, b.email, b.phone, b.service,
                   b.category_name, b.price, b.currency, b.duration_minutes,
                   b.preferred_date, b.preferred_time, b.notes, b.status,
                   coalesce(b.payment_status, 'unpaid') as payment_status,
                   b.payment_method, b.payment_provider, b.stripe_payment_intent_id,
                   b.stripe_session_id, b.paid_at, b.created_at,
                   coalesce(
                     (select json_agg(json_build_object(
                        'id', i.id,
                        'service_id', i.service_id,
                        'service_name', i.service_name,
                        'category_name', i.category_name,
                        'unit_price', i.unit_price,
                        'quantity', i.quantity,
                        'duration_minutes', i.duration_minutes,
                        'line_total', i.line_total,
                        'status', i.status,
                        'payment_status', i.payment_status
                      ) order by i.created_at)
                      from booking_items i where i.booking_id = b.id),
                     '[]'::json) as items
            from bookings b
            order by b.created_at desc
            limit 500`;

          const statsRows = await sql`
            select
              count(*)::int as total,
              count(*) filter (where coalesce(payment_status,'unpaid') = 'paid')::int as paid,
              count(*) filter (where coalesce(payment_status,'unpaid') <> 'paid'
                               and status <> 'cancelled')::int as pending_payment,
              count(*) filter (where status = 'completed')::int as completed,
              count(*) filter (where status = 'cancelled')::int as cancelled,
              coalesce(sum(price) filter (where coalesce(payment_status,'unpaid') = 'paid'), 0) as revenue
            from bookings`;

          return json({ bookings, stats: statsRows[0] });
        } catch (error) {
          console.error("GET /api/admin/bookings failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
      },
    },
  },
});
