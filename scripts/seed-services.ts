/**
 * Seeds the real Mayor Beauty Place booking categories and services.
 * Idempotent: re-running updates sort order and keeps existing prices/durations.
 *
 * Usage: DATABASE_URL="postgres://…" bun scripts/seed-services.ts
 */
import postgres from "postgres";

import { CATALOG } from "../src/lib/service-catalog";

if (import.meta.main) {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const sql = postgres(url, { prepare: false });

  for (const [i, block] of CATALOG.entries()) {
    const [cat] = await sql`
      insert into service_categories (name, sort_order, active)
      values (${block.category}, ${i}, true)
      on conflict (name) do update set sort_order = excluded.sort_order, updated_at = now()
      returning id`;
    const categoryId = cat!["id"] as string;
    for (const [j, name] of block.services.entries()) {
      await sql`
        insert into services (category_id, name, sort_order, active)
        values (${categoryId}, ${name}, ${j}, true)
        on conflict (category_id, lower(name)) do update
          set sort_order = excluded.sort_order, updated_at = now()`;
    }
    console.log(`${block.category}: ${block.services.length} services`);
  }

  await sql.end();
  console.log("Done.");
}
