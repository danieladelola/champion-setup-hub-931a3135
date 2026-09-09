-- Ad scheduling + display type (popup vs embedded banner)
alter table ads add column if not exists display_type text not null default 'embed';
alter table ads add column if not exists starts_at timestamptz;
alter table ads add column if not exists ends_at timestamptz;
alter table ads add column if not exists popup_delay_seconds integer not null default 3;

create index if not exists ads_schedule_idx on ads (active, starts_at, ends_at);
