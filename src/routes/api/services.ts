import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { ensureBookingCatalog } from "@/lib/booking-bootstrap.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/services")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await ensureBookingCatalog();
          const sql = getDb();
          const categories = await sql`
            select id, name, description, sort_order
            from service_categories
            where active = true
            order by sort_order asc, name asc`;
          const services = await sql`
            select s.id, s.category_id, s.name, s.description, s.price, s.duration_minutes, s.sort_order
            from services s
            join service_categories c on c.id = s.category_id
            where s.active = true and c.active = true
            order by s.sort_order asc, s.name asc`;
          return json({ categories, services });
        } catch (error) {
          console.error("GET /api/services failed", error);
          return json({ categories: [], services: [] });
        }
      },
    },
  },
});
