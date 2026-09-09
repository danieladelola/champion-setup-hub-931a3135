import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/products/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const sql = getDb();
        const rows = await sql`
          select id, name, slug, short_description, description, category, price, sale_price,
                 sku, image_url, gallery_images, featured, stock_quantity
          from products
          where active = true and slug = ${params.slug}
          limit 1`;
        if (!rows[0]) return json({ error: "Product not found" }, { status: 404 });
        return json({ product: rows[0] });
      },
    },
  },
});
