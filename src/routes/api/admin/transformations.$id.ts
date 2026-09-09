import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { transformationSchema } from "@/lib/transformations.server";

export const Route = createFileRoute("/api/admin/transformations/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        const rows = await sql`select * from transformations where id = ${params.id} limit 1`;
        if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
        return json({ transformation: rows[0] });
      },
      PUT: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const parsed = transformationSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { error: parsed.error.issues[0]?.message ?? "Invalid entry" },
            { status: 400 },
          );
        }
        const t = parsed.data;
        const sql = getDb();
        try {
          const rows = await sql`
            update transformations set
              name = ${t.name}, description = ${t.description ?? null},
              before_image_url = ${t.before_image_url}, after_image_url = ${t.after_image_url},
              sort_order = ${t.sort_order}, active = ${t.active}, updated_at = now()
            where id = ${params.id}
            returning *`;
          if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
          return json({ transformation: rows[0] });
        } catch {
          return json({ error: "Could not update entry" }, { status: 500 });
        }
      },
      DELETE: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        await sql`delete from transformations where id = ${params.id}`;
        return json({ ok: true });
      },
    },
  },
});
