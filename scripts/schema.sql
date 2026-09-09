-- Mayor Beauty Place — database schema
-- Usage: psql "$DATABASE_URL" -f scripts/schema.sql

create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  category text,
  price numeric(10,2) not null default 0,
  sale_price numeric(10,2),
  sku text,
  stock_quantity integer not null default 0,
  image_url text,
  gallery_images text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text,
  customer_email text,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text,
  notes text,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  sku text,
  unit_price numeric(10,2) not null default 0,
  quantity integer not null default 1,
  line_total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on order_items(order_id);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text,
  postcode text,
  notes text,
  source text,
  created_at timestamptz not null default now()
);
alter table customers add column if not exists first_name text;
alter table customers add column if not exists last_name text;
alter table customers add column if not exists address text;
alter table customers add column if not exists city text;
alter table customers add column if not exists state text;
alter table customers add column if not exists country text;
alter table customers add column if not exists postcode text;
alter table customers add column if not exists notes text;
alter table customers add column if not exists source text;
create unique index if not exists customers_email_lower_idx on customers(lower(email));

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  service text,
  preferred_date date,
  preferred_time text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  subject text,
  message text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  content_type text not null,
  byte_size integer not null default 0,
  data bytea not null,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default 'Administrator',
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  avatar_url text,
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  token text primary key,
  user_id uuid not null references admin_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_sessions_user_idx on admin_sessions(user_id);

create table if not exists transformations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  before_image_url text not null,
  after_image_url text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists transformations_active_idx on transformations(active, sort_order);
