-- Health profiles shown on the website, each split into sub-profiles of tests.
-- Test ids refer to the catalogue in src/data/tests.json.
--
-- Only the server (service role key) reads or writes these tables. Row level
-- security is on with no policies, so the public anon key gets nothing.

create table public.profiles (
  id          text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  tag         text not null default '',
  category    text not null,
  tagline     text not null default '',
  price       integer not null check (price >= 0),
  icon        text not null default 'layers',
  hue         smallint not null default 275 check (hue between 0 and 359),
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.sub_profiles (
  id          bigint generated always as identity primary key,
  profile_id  text not null references public.profiles (id) on delete cascade,
  name        text not null,
  description text not null default '',
  test_ids    text[] not null default '{}',
  sort_order  integer not null default 0
);

create index sub_profiles_profile_id_idx on public.sub_profiles (profile_id, sort_order);

alter table public.profiles enable row level security;
alter table public.sub_profiles enable row level security;

-- Saves a profile and replaces its sub-profiles in one transaction.
-- payload: { id, name, tag, category, tagline, price, icon, hue, sort_order,
--            published, subs: [{ name, description, tests: [test id] }] }
create or replace function public.save_profile(payload jsonb)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
  values (
    payload->>'id', payload->>'name', payload->>'tag', payload->>'category', payload->>'tagline',
    (payload->>'price')::integer, payload->>'icon', (payload->>'hue')::smallint,
    (payload->>'sort_order')::integer, (payload->>'published')::boolean
  )
  on conflict (id) do update set
    name = excluded.name, tag = excluded.tag, category = excluded.category,
    tagline = excluded.tagline, price = excluded.price, icon = excluded.icon,
    hue = excluded.hue, sort_order = excluded.sort_order, published = excluded.published,
    updated_at = now();

  delete from sub_profiles where profile_id = payload->>'id';

  insert into sub_profiles (profile_id, name, description, test_ids, sort_order)
  select payload->>'id', s->>'name', coalesce(s->>'description', ''),
         array(select jsonb_array_elements_text(s->'tests')), (ord - 1)::integer
  from jsonb_array_elements(payload->'subs') with ordinality as t(s, ord);
end;
$$;

revoke execute on function public.save_profile(jsonb) from public, anon, authenticated;
