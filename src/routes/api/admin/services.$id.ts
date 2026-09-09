import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { serviceSchema } from "@/lib/services.server";

export const Route = createFileRoute("/api/admin/services/$id")({
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
            update services set
              category_id = ${s.category_id}, name = ${s.name},
              description = ${s.description ?? null}, note = ${s.note ?? null}, price = ${s.price},
              duration_minutes = ${s.duration_minutes}, sort_order = ${s.sort_order},
              active = ${s.active}, updated_at = now()
            where id = ${params.id}
            returning *`;
          if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
          return json({ service: rows[0] });
        } catch {
          return json({ error: "Could not update service" }, { status: 500 });
        }
      },
      PATCH: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request).catch(() => null);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const active = (body as { active?: unknown })?.active;
        if (typeof active !== "boolean") {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        try {
          const sql = getDb();
          const rows = await sql`
            update services set active = ${active}, updated_at = now()
            where id = ${params.id}
            returning *`;
          if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
          return json({ service: rows[0] });
        } catch {
          return json({ error: "Could not update service" }, { status: 500 });
        }
      },
      DELETE: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request).catch(() => null);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        await sql`delete from services where id = ${params.id}`;
        return json({ ok: true });
      },
    },
  },
});
