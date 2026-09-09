import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { transformationSchema } from "@/lib/transformations.server";

export const Route = createFileRoute("/api/admin/transformations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          const sql = getDb();
          const transformations = await sql`
            select * from transformations order by sort_order asc, created_at desc`;
          return json({ transformations });
        } catch (error) {
          console.error("GET /api/admin/transformations failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
      },
      POST: async ({ request }) => {
        let admin;
        try {
          admin = await getAdminFromRequest(request);
        } catch (error) {
          console.error("POST /api/admin/transformations auth failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
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
            insert into transformations (name, description, before_image_url, after_image_url, sort_order, active)
            values (${t.name}, ${t.description ?? null}, ${t.before_image_url},
              ${t.after_image_url}, ${t.sort_order}, ${t.active})
            returning *`;
          return json({ transformation: rows[0] }, { status: 201 });
        } catch {
          return json({ error: "Could not create entry" }, { status: 500 });
        }
      },
    },
  },
});
