-- Multi-service bookings: one booking row (the main reference + one payment)
-- with one row per selected service.
create table if not exists booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id uuid,
  category_id uuid,
  service_name text not null,
  category_name text,
  unit_price numeric not null default 0,
  quantity integer not null default 1,
  duration_minutes integer not null default 60,
  line_total numeric not null default 0,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now()
);

create index if not exists booking_items_booking_idx on booking_items (booking_id);

-- Backfill: every existing single-service booking becomes a one-item booking so
-- the admin dashboard and the confirmation page can use one code path.
insert into booking_items (booking_id, service_id, category_id, service_name,
  category_name, unit_price, quantity, duration_minutes, line_total, status, payment_status)
select b.id, b.service_id, b.category_id, coalesce(b.service, 'Service'),
       b.category_name, coalesce(b.price, 0), 1, coalesce(b.duration_minutes, 60),
       coalesce(b.price, 0), b.status, coalesce(b.payment_status, 'unpaid')
from bookings b
where not exists (select 1 from booking_items i where i.booking_id = b.id);
