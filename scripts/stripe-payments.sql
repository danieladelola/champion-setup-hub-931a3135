-- Stripe payment tracking on orders.
alter table orders add column if not exists payment_provider text;
alter table orders add column if not exists payment_method text;
alter table orders add column if not exists currency text not null default 'GBP';
alter table orders add column if not exists stripe_session_id text;
alter table orders add column if not exists stripe_payment_intent_id text;
alter table orders add column if not exists paid_at timestamptz;

create unique index if not exists orders_stripe_session_id_key
  on orders (stripe_session_id) where stripe_session_id is not null;
create index if not exists orders_stripe_payment_intent_idx
  on orders (stripe_payment_intent_id);

-- Stripe payment tracking on bookings.
alter table bookings add column if not exists booking_reference text;
alter table bookings add column if not exists payment_provider text;
alter table bookings add column if not exists payment_method text;
alter table bookings add column if not exists currency text not null default 'GBP';
alter table bookings add column if not exists stripe_session_id text;
alter table bookings add column if not exists stripe_payment_intent_id text;
alter table bookings add column if not exists paid_at timestamptz;
alter table bookings add column if not exists updated_at timestamptz not null default now();

-- Full (non-partial) unique index so ON CONFLICT (booking_reference) can use it.
create unique index if not exists bookings_booking_reference_key
  on bookings (booking_reference);
create unique index if not exists bookings_stripe_session_id_key
  on bookings (stripe_session_id) where stripe_session_id is not null;
create index if not exists bookings_stripe_payment_intent_idx
  on bookings (stripe_payment_intent_id);
