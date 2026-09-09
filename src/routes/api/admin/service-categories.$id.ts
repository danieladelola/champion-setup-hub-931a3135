import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { categorySchema } from "@/lib/services.server";

export const Route = createFileRoute("/api/admin/service-categories/$id")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
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
            update service_categories set
              name = ${c.name}, description = ${c.description ?? null},
              sort_order = ${c.sort_order}, active = ${c.active}, updated_at = now()
            where id = ${params.id}
            returning *`;
          if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
          return json({ category: rows[0] });
        } catch {
          return json({ error: "Could not update category" }, { status: 500 });
        }
      },
      DELETE: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request).catch(() => null);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        await sql`delete from service_categories where id = ${params.id}`;
        return json({ ok: true });
      },
    },
  },
});
