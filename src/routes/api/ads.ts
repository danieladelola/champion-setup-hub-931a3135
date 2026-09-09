import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/ads")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const placement = new URL(request.url).searchParams.get("placement");
          const sql = getDb();
          const ads = placement
            ? await sql`
                select id, title, image_url, link_url, placement, sort_order,
                       display_type, starts_at, ends_at, popup_delay_seconds
                from ads
                where active = true
                  and placement = ${placement}
                  and (starts_at is null or starts_at <= now())
                  and (ends_at is null or ends_at > now())
                order by sort_order asc, created_at desc`
            : await sql`
                select id, title, image_url, link_url, placement, sort_order,
                       display_type, starts_at, ends_at, popup_delay_seconds
                from ads
                where active = true
                  and (starts_at is null or starts_at <= now())
                  and (ends_at is null or ends_at > now())
                order by placement asc, sort_order asc, created_at desc`;
          return json({ ads });
        } catch (error) {
          console.error("GET /api/ads failed", error);
          return json({ ads: [] });
        }
      },
    },
  },
});
