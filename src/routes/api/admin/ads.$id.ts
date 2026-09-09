import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { adSchema } from "@/lib/ads.server";

export const Route = createFileRoute("/api/admin/ads/$id")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const parsed = adSchema.safeParse(body);
        if (!parsed.success) {
          return json({ error: parsed.error.issues[0]?.message ?? "Invalid ad" }, { status: 400 });
        }
        const a = parsed.data;
        const sql = getDb();
        try {
          const rows = await sql`
            update ads set
              title = ${a.title}, image_url = ${a.image_url}, link_url = ${a.link_url},
              placement = ${a.placement}, sort_order = ${a.sort_order}, active = ${a.active},
              display_type = ${a.display_type}, starts_at = ${a.starts_at}, ends_at = ${a.ends_at},
              popup_delay_seconds = ${a.popup_delay_seconds},
              updated_at = now()
            where id = ${params.id}
            returning *`;
          if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
          return json({ ad: rows[0] });
        } catch (error) {
          console.error("PUT /api/admin/ads/:id failed", error);
          return json({ error: "Could not update ad" }, { status: 500 });
        }
      },
      PATCH: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        let body: { active?: boolean };
        try {
          body = (await request.json()) as { active?: boolean };
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        if (typeof body.active !== "boolean") {
          return json({ error: "Invalid status" }, { status: 400 });
        }
        const sql = getDb();
        const rows = await sql`
          update ads set active = ${body.active}, updated_at = now()
          where id = ${params.id} returning *`;
        if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
        return json({ ad: rows[0] });
      },
      DELETE: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        await sql`delete from ads where id = ${params.id}`;
        return json({ ok: true });
      },
    },
  },
});
