import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { ensureBookingCatalog } from "@/lib/booking-bootstrap.server";
import { getDb } from "@/lib/db.server";
import { categorySchema } from "@/lib/services.server";

export const Route = createFileRoute("/api/admin/service-categories")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          await ensureBookingCatalog();
          const sql = getDb();
          const categories = await sql`
            select c.*, (select count(*) from services s where s.category_id = c.id)::int as service_count
            from service_categories c
            order by c.sort_order asc, c.name asc`;
          return json({ categories });
        } catch (error) {
          console.error("GET /api/admin/service-categories failed", error);
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
        const parsed = categorySchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { error: parsed.error.issues[0]?.message ?? "Invalid category" },
            { status: 400 },
          );
        }
        const c = parsed.data;
        try {
          const sql = getDb();
          const rows = await sql`
            insert into service_categories (name, description, sort_order, active)
            values (${c.name}, ${c.description ?? null}, ${c.sort_order}, ${c.active})
            returning *`;
          return json({ category: rows[0] }, { status: 201 });
        } catch {
          return json({ error: "Could not create category" }, { status: 500 });
        }
      },
    },
  },
});
