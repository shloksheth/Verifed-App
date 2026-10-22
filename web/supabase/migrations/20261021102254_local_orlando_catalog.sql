-- Public source records can describe real businesses without implying a partnership.
alter table public.restaurants drop constraint restaurants_fictional_check;
alter table public.restaurants add constraint restaurants_real_catalog_not_connected
  check (fictional or not confirmed);
alter table public.restaurants add column details jsonb not null default '{}'::jsonb
  check (jsonb_typeof(details) = 'object');

-- The catalog key survives database-generated IDs and makes repeat imports idempotent.
create unique index dishes_catalog_key on public.dishes ((body->>'catalogKey'))
  where body ? 'catalogKey';
