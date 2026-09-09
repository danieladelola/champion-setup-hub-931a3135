-- Ad management system
create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  image_url text not null,
  link_url text,
  placement text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ads_placement_active_idx on ads (placement, active, sort_order);
