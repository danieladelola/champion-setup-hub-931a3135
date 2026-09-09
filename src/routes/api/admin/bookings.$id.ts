import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { getBookingItems } from "@/lib/bookings.server";
import { BOOKING_PAYMENT_STATUSES, BOOKING_STATUSES } from "@/lib/services.server";

export const Route = createFileRoute("/api/admin/bookings/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request).catch(() => null);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        const rows = await sql`select * from bookings where id = ${params.id} limit 1`;
        if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
        const items = await getBookingItems(params.id);
        return json({ booking: { ...rows[0], items } });
      },
      PATCH: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request).catch(() => null);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        let body: { status?: string; payment_status?: string };
        try {
          body = (await request.json()) as { status?: string; payment_status?: string };
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }

        const { status, payment_status: paymentStatus } = body;
        if (status && !(BOOKING_STATUSES as readonly string[]).includes(status)) {
          return json({ error: "Invalid status" }, { status: 400 });
        }
        if (
          paymentStatus &&
          !(BOOKING_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)
        ) {
          return json({ error: "Invalid payment status" }, { status: 400 });
        }
        if (!status && !paymentStatus) {
          return json({ error: "Nothing to update" }, { status: 400 });
        }

        const sql = getDb();
        // Booking status and payment status are independent; only touch what was sent.
        const rows = await sql`
          update bookings set
            status = coalesce(${status ?? null}, status),
            payment_status = coalesce(${paymentStatus ?? null}, payment_status),
            paid_at = case
              when ${paymentStatus ?? null} = 'paid' then coalesce(paid_at, now())
              when ${paymentStatus ?? null} in ('unpaid', 'refunded', 'failed') then null
              else paid_at end,
            updated_at = now()
          where id = ${params.id}
          returning *`;
        if (!rows[0]) return json({ error: "Not found" }, { status: 404 });

        // Every service inside the booking follows the booking's payment.
        await sql`
          update booking_items set
            status = coalesce(${status ?? null}, status),
            payment_status = coalesce(${paymentStatus ?? null}, payment_status)
          where booking_id = ${params.id}`;

        const items = await getBookingItems(params.id);
        return json({ booking: { ...rows[0], items } });
      },
      DELETE: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request).catch(() => null);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        await sql`delete from booking_items where booking_id = ${params.id}`;
        await sql`delete from bookings where id = ${params.id}`;
        return json({ ok: true });
      },
    },
  },
});
