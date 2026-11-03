-- Reusable sub-profiles. A sub-profile (e.g. "Heart": Lipid Profile) is created
-- once and can be added to many profiles; editing it updates every profile
-- that uses it. A profile is built from sub-profiles plus any extra tests.
--
-- Run after 0001_profiles.sql. Existing per-profile sub-profiles are copied
-- into the library (identical ones are merged), and the old table is kept as
-- sub_profiles_legacy so nothing is lost; drop it once you are happy.

create table public.sub_profile_library (
  id          bigint generated always as identity primary key,
  name        text not null,
  description text not null default '',
  test_ids    text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Which sub-profiles a profile uses, in display order. A sub-profile that is
-- still used by a profile can't be deleted.
create table public.profile_sub_profiles (
  profile_id     text not null references public.profiles (id) on delete cascade,
  sub_profile_id bigint not null references public.sub_profile_library (id) on delete restrict,
  sort_order     integer not null default 0,
  primary key (profile_id, sub_profile_id)
);

create index profile_sub_profiles_sub_idx on public.profile_sub_profiles (sub_profile_id);

-- Tests added to a profile on their own, outside any sub-profile.
alter table public.profiles add column test_ids text[] not null default '{}';

alter table public.sub_profile_library enable row level security;
alter table public.profile_sub_profiles enable row level security;

-- Move existing data across.
insert into public.sub_profile_library (name, description, test_ids)
select distinct name, description, test_ids from public.sub_profiles;

insert into public.profile_sub_profiles (profile_id, sub_profile_id, sort_order)
select s.profile_id, l.id, min(s.sort_order)
from public.sub_profiles s
join public.sub_profile_library l
  on l.name = s.name and l.description = s.description and l.test_ids = s.test_ids
group by s.profile_id, l.id;

alter table public.sub_profiles rename to sub_profiles_legacy;

-- Saves a profile and replaces its sub-profile links in one transaction.
-- payload: { id, name, tag, category, tagline, price, icon, hue, sort_order,
--            published, test_ids: [test id], sub_profile_ids: [library id] }
drop function public.save_profile(jsonb);

create function public.save_profile(payload jsonb)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published, test_ids)
  values (
    payload->>'id', payload->>'name', payload->>'tag', payload->>'category', payload->>'tagline',
    (payload->>'price')::integer, payload->>'icon', (payload->>'hue')::smallint,
    (payload->>'sort_order')::integer, (payload->>'published')::boolean,
    array(select jsonb_array_elements_text(payload->'test_ids'))
  )
  on conflict (id) do update set
    name = excluded.name, tag = excluded.tag, category = excluded.category,
    tagline = excluded.tagline, price = excluded.price, icon = excluded.icon,
    hue = excluded.hue, sort_order = excluded.sort_order, published = excluded.published,
    test_ids = excluded.test_ids, updated_at = now();

  delete from profile_sub_profiles where profile_id = payload->>'id';

  insert into profile_sub_profiles (profile_id, sub_profile_id, sort_order)
  select payload->>'id', (v #>> '{}')::bigint, (ord - 1)::integer
  from jsonb_array_elements(payload->'sub_profile_ids') with ordinality as t(v, ord);
end;
$$;

revoke execute on function public.save_profile(jsonb) from public, anon, authenticated;
