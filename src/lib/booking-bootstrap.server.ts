/**
 * Ensures the booking tables exist and the service catalog is populated.
 * Runs once per server process so a freshly deployed database (e.g. Coolify)
 * serves the same categories/services as development.
 */
import { getDb } from "./db.server";
import { CATALOG } from "./service-catalog";

let bootstrapPromise: Promise<void> | null = null;

async function run(): Promise<void> {
  const sql = getDb();

  await sql`create extension if not exists "pgcrypto"`;

  await sql`
    create table if not exists service_categories (
      id uuid primary key default gen_random_uuid(),
      name text not null unique,
      description text,
      sort_order integer not null default 0,
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;

  await sql`
    create table if not exists services (
      id uuid primary key default gen_random_uuid(),
      category_id uuid not null references service_categories(id) on delete cascade,
      name text not null,
      description text,
      price numeric(10,2) not null default 0,
      duration_minutes integer not null default 60,
      sort_order integer not null default 0,
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;

  await sql`alter table services add column if not exists note text`;

  await sql`create index if not exists services_category_idx on services(category_id, sort_order)`;
  await sql`create unique index if not exists services_category_name_idx on services(category_id, lower(name))`;

  // Booking columns used by the public booking form (tolerated if bookings is missing).
  try {
    await sql`alter table bookings add column if not exists category_id uuid references service_categories(id) on delete set null`;
    await sql`alter table bookings add column if not exists service_id uuid references services(id) on delete set null`;
    await sql`alter table bookings add column if not exists category_name text`;
    await sql`alter table bookings add column if not exists price numeric(10,2) not null default 0`;
    await sql`alter table bookings add column if not exists duration_minutes integer not null default 60`;
    await sql`alter table bookings add column if not exists payment_status text not null default 'unpaid'`;
    await sql`alter table bookings add column if not exists customer_name text`;
    await sql`alter table bookings add column if not exists customer_email text`;
    await sql`alter table bookings add column if not exists full_name text`;
    await sql`alter table bookings add column if not exists email text`;
    await sql`alter table bookings add column if not exists phone text`;
    await sql`alter table bookings add column if not exists preferred_date date`;
    await sql`alter table bookings add column if not exists preferred_time text`;
    await sql`alter table bookings add column if not exists notes text`;
    await sql`alter table bookings alter column customer_name drop not null`;
  } catch (error) {
    console.error("booking column bootstrap skipped", error);
  }

  const [row] = await sql<{ count: number }[]>`select count(*)::int as count from service_categories`;
  if ((row?.count ?? 0) > 0) return;

  for (const [i, block] of CATALOG.entries()) {
    const [cat] = await sql<{ id: string }[]>`
      insert into service_categories (name, sort_order, active)
      values (${block.category}, ${i}, true)
      on conflict (name) do update set sort_order = excluded.sort_order, updated_at = now()
      returning id`;
    if (!cat) continue;
    for (const [j, name] of block.services.entries()) {
      await sql`
        insert into services (category_id, name, sort_order, active)
        values (${cat.id}, ${name}, ${j}, true)
        on conflict (category_id, lower(name)) do nothing`;
    }
  }
  console.log("Booking catalog seeded.");
}

export function ensureBookingCatalog(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = run().catch((error) => {
      console.error("Booking bootstrap failed", error);
      bootstrapPromise = null;
    });
  }
  return bootstrapPromise;
}
