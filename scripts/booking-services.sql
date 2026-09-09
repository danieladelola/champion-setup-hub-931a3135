-- Mayor Beauty Place — booking categories, services and booking columns
-- Usage: psql "$DATABASE_URL" -f scripts/booking-services.sql

create extension if not exists "pgcrypto";

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
);
alter table services add column if not exists note text;
create index if not exists services_category_idx on services(category_id, sort_order);
create unique index if not exists services_category_name_idx on services(category_id, lower(name));

alter table bookings add column if not exists category_id uuid references service_categories(id) on delete set null;
alter table bookings add column if not exists service_id uuid references services(id) on delete set null;
alter table bookings add column if not exists category_name text;
alter table bookings add column if not exists price numeric(10,2) not null default 0;
alter table bookings add column if not exists duration_minutes integer not null default 60;
alter table bookings add column if not exists payment_status text not null default 'unpaid';

-- Legacy/compat columns used by older booking rows
alter table bookings add column if not exists customer_name text;
alter table bookings add column if not exists customer_email text;
alter table bookings add column if not exists full_name text;
alter table bookings add column if not exists email text;
alter table bookings add column if not exists phone text;
alter table bookings add column if not exists preferred_date date;
alter table bookings add column if not exists preferred_time text;
alter table bookings add column if not exists notes text;
alter table bookings alter column customer_name drop not null;
