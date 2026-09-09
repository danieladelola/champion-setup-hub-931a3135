import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { ensureBookingCatalog } from "@/lib/booking-bootstrap.server";
import { getDb } from "@/lib/db.server";
import { serviceSchema } from "@/lib/services.server";

export const Route = createFileRoute("/api/admin/services")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          await ensureBookingCatalog();
          const sql = getDb();
          const services = await sql`
            select s.*, c.name as category_name
            from services s
            join service_categories c on c.id = s.category_id
            order by c.sort_order asc, s.sort_order asc, s.name asc`;
          return json({ services });
        } catch (error) {
          console.error("GET /api/admin/services failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
      },
      POST: async ({ request }) => {
        const admin = await getAdminFromRequest(request).catch(() => null);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const parsed = serviceSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { error: parsed.error.issues[0]?.message ?? "Invalid service" },
            { status: 400 },
          );
        }
        const s = parsed.data;
        try {
          const sql = getDb();
          const rows = await sql`
            insert into services (category_id, name, description, note, price, duration_minutes, sort_order, active)
            values (${s.category_id}, ${s.name}, ${s.description ?? null}, ${s.note ?? null}, ${s.price},
              ${s.duration_minutes}, ${s.sort_order}, ${s.active})
            returning *`;
          return json({ service: rows[0] }, { status: 201 });
        } catch {
          return json({ error: "Could not create service" }, { status: 500 });
        }
      },
    },
  },
});
