import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/transformations")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const sql = getDb();
          const transformations = await sql`
            select id, name, description, before_image_url, after_image_url, sort_order
            from transformations
            where active = true
            order by sort_order asc, created_at desc`;
          return json({ transformations });
        } catch (error) {
          console.error("GET /api/transformations failed", error);
          return json({ transformations: [] });
        }
      },

    },
  },
});
