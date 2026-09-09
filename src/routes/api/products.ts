import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const category = (url.searchParams.get("category") ?? "").trim();
          const sql = getDb();
          const products = await sql`
            select id, name, slug, short_description, description, category, price, sale_price,
                   image_url, gallery_images, featured, stock_quantity
            from products
            where active = true and (${category === ""} or category = ${category})
            order by featured desc, created_at desc`;
          return json({ products });
        } catch (error) {
          console.error("[api/products] failed", error);
          return json(
            {
              products: [],
              error: error instanceof Error ? error.message : "Unknown database error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
