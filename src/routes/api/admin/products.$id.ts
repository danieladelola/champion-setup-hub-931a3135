import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";
import { productSchema } from "@/lib/products.server";

export const Route = createFileRoute("/api/admin/products/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        const rows = await sql`select * from products where id = ${params.id} limit 1`;
        if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
        return json({ product: rows[0] });
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
            update products set
              name = ${p.name}, slug = ${p.slug}, description = ${p.description ?? null},
              short_description = ${p.short_description ?? null}, category = ${p.category ?? null},
              price = ${p.price}, sale_price = ${p.sale_price ?? null}, sku = ${p.sku ?? null},
              stock_quantity = ${p.stock_quantity}, image_url = ${p.image_url ?? null},
              gallery_images = ${JSON.stringify(p.gallery_images)}::jsonb,
              featured = ${p.featured}, active = ${p.active}, updated_at = now()
            where id = ${params.id}
            returning *`;
          if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
          return json({ product: rows[0] });
        } catch (err) {
          const message = String((err as Error).message ?? "");
          if (message.includes("duplicate key")) {
            return json({ error: "A product with that slug already exists" }, { status: 409 });
          }
          return json({ error: "Could not update product" }, { status: 500 });
        }
      },
      DELETE: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        await sql`delete from products where id = ${params.id}`;
        return json({ ok: true });
      },
    },
  },
});
