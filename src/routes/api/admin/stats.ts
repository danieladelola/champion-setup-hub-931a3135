import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/admin/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        const [counts] = await sql`
          select
            (select count(*)::int from products) as products,
            (select count(*)::int from orders) as orders,
            (select count(*)::int from bookings) as bookings,
            (select count(*)::int from customers) as customers,
            (select count(*)::int from messages where read = false) as unread_messages,
            (select coalesce(sum(total), 0) from orders) as revenue`;
        const recentOrders = await sql`
          select id, customer_name, total, status, created_at
          from orders order by created_at desc limit 5`;
        const recentBookings = await sql`
          select id, customer_name, service, scheduled_at, status, created_at
          from bookings order by created_at desc limit 5`;
        const lowStock = await sql`
          select id, name, stock_quantity from products
          where stock_quantity <= 5 order by stock_quantity asc limit 5`;
        const monthly = await sql`
          with months as (
            select date_trunc('month', now()) - (n || ' month')::interval as m
            from generate_series(5, 0, -1) as n
          )
          select to_char(m, 'Mon') as label,
                 (select count(*)::int from orders o where date_trunc('month', o.created_at) = m) as orders,
                 (select count(*)::int from bookings b where date_trunc('month', b.created_at) = m) as bookings,
                 (select coalesce(sum(o.total), 0) from orders o where date_trunc('month', o.created_at) = m) as revenue
          from months order by m`;
        const orderStatus = await sql`
          select status as label, count(*)::int as value from orders group by status order by value desc`;
        const bookingStatus = await sql`
          select status as label, count(*)::int as value from bookings group by status order by value desc`;
        return json({
          counts,
          recentOrders,
          recentBookings,
          lowStock,
          monthly,
          orderStatus,
          bookingStatus,
        });
      },
    },
  },
});
