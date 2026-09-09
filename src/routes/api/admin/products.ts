import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { productSchema } from "@/lib/products.server";

export const Route = createFileRoute("/api/admin/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const url = new URL(request.url);
        const search = (url.searchParams.get("search") ?? "").trim();
        const category = (url.searchParams.get("category") ?? "").trim();
        const status = (url.searchParams.get("status") ?? "").trim();
        const sql = getDb();
        const products = await sql`
          select * from products
          where (${search === ""} or name ilike ${"%" + search + "%"} or coalesce(sku,'') ilike ${"%" + search + "%"})
            and (${category === ""} or category = ${category})
            and (${status === ""} or active = ${status === "active"})
          order by created_at desc`;
        return json({ products });
      },
      POST: async ({ request }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const parsed = productSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { error: parsed.error.issues[0]?.message ?? "Invalid product" },
            { status: 400 },
          );
        }
        const p = parsed.data;
        const sql = getDb();
        try {
          const rows = await sql`
            insert into products (name, slug, description, short_description, category, price,
              sale_price, sku, stock_quantity, image_url, gallery_images, featured, active)
            values (${p.name}, ${p.slug}, ${p.description ?? null}, ${p.short_description ?? null},
              ${p.category ?? null}, ${p.price}, ${p.sale_price ?? null}, ${p.sku ?? null},
              ${p.stock_quantity}, ${p.image_url ?? null}, ${JSON.stringify(p.gallery_images)}::jsonb,
              ${p.featured}, ${p.active})
            returning *`;
          return json({ product: rows[0] }, { status: 201 });
        } catch (err) {
          const message = String((err as Error).message ?? "");
          if (message.includes("duplicate key")) {
            return json({ error: "A product with that slug already exists" }, { status: 409 });
          }
          return json({ error: "Could not create product" }, { status: 500 });
        }
      },
    },
  },
});
