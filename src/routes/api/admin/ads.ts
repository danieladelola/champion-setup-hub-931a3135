import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { adSchema } from "@/lib/ads.server";

export const Route = createFileRoute("/api/admin/ads")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          const sql = getDb();
          const ads = await sql`
            select * from ads order by placement asc, sort_order asc, created_at desc`;
          return json({ ads });
        } catch (error) {
          console.error("GET /api/admin/ads failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
      },
      POST: async ({ request }) => {
        let admin;
        try {
          admin = await getAdminFromRequest(request);
        } catch (error) {
          console.error("POST /api/admin/ads auth failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
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
            insert into ads (title, image_url, link_url, placement, sort_order, active,
                             display_type, starts_at, ends_at, popup_delay_seconds)
            values (${a.title}, ${a.image_url}, ${a.link_url}, ${a.placement}, ${a.sort_order}, ${a.active},
                    ${a.display_type}, ${a.starts_at}, ${a.ends_at}, ${a.popup_delay_seconds})
            returning *`;
          return json({ ad: rows[0] }, { status: 201 });
        } catch (error) {
          console.error("POST /api/admin/ads failed", error);
          return json({ error: "Could not create ad" }, { status: 500 });
        }
      },
    },
  },
});
