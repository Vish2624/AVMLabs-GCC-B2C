-- The "Ideal for" and "Why take this profile" lists on a profile's reel, editable in the admin.
--
-- Run after 0004_country_prices.sql. In one transaction it:
--   1. adds the two lists to profiles;
--   2. fills them for the eight original profiles with the text the website had built in;
--   3. updates save_profile to store them.

begin;

-- 1. The lists.
alter table public.profiles
  add column ideal text[] not null default '{}',
  add column benefits text[] not null default '{}';

-- 2. The text from src/logic/01-data.js. Profiles with other ids start empty.
update public.profiles p set ideal = v.ideal, benefits = v.benefits
from (values
  ('essential', array['Adults 18+', 'Annual check-up', 'No symptoms']::text[], array['Screens blood, heart, liver, kidney & thyroid', 'Catch silent issues before they show up', 'A baseline to compare next year against']::text[]),
  ('vitamin', array['Fatigue', 'Hair fall', 'Desk jobs', 'Vegetarian diets']::text[], array['Find deficiencies behind tiredness & aches', 'Checks iron stores, not just haemoglobin', 'Know exactly what to supplement']::text[]),
  ('thyroid', array['Weight changes', 'Hair thinning', 'Family history']::text[], array['Full T3, T4 & TSH with antibody check', 'Helps spot autoimmune thyroid early', 'Lipids included — thyroid affects cholesterol']::text[]),
  ('women', array['Irregular cycles', 'Planning pregnancy', 'Age 25–45']::text[], array['Key reproductive hormones in one draw', 'AMH gives a view of ovarian reserve', 'Best taken on day 2–5 of your cycle']::text[]),
  ('pcos', array['Irregular periods', 'Acne & hair growth', 'Weight gain']::text[], array['Checks LH:FSH ratio & androgens', 'Insulin & glucose for metabolic risk', 'Helps your doctor assess PCOS']::text[]),
  ('men', array['Low energy', 'Men 30+', 'Stress & sleep issues']::text[], array['Testosterone & cortisol for energy and stress', 'Sugar, cholesterol & Vitamin D in one draw', 'PSA screening for men over 40']::text[]),
  ('diabetes', array['Diabetic or pre-diabetic', 'Family history', 'Every 3 months']::text[], array['HbA1c shows your 3-month average', 'Kidney & urine checks for early damage', 'Insulin reveals resistance early']::text[]),
  ('fullbody', array['Adults 30+', 'Yearly full checkup', 'Busy schedules']::text[], array['Covers 9 body systems in one visit', 'Includes Vitamin D, B12 & iron', 'Reports shared on WhatsApp']::text[])
) as v(id, ideal, benefits)
where p.id = v.id;

-- 3. Saves a profile and replaces its sub-profile links in one transaction.
-- payload: { id, name, tag, category, tagline, ideal: [text], benefits: [text], prices: { AE, SA, BH },
--            icon, hue, sort_order, published, test_ids: [test id], sub_profile_ids: [library id] }
create or replace function public.save_profile(payload jsonb)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into profiles (id, name, tag, category, tagline, ideal, benefits, prices, icon, hue, sort_order, published, test_ids)
  values (
    payload->>'id', payload->>'name', payload->>'tag', payload->>'category', payload->>'tagline',
    array(select jsonb_array_elements_text(payload->'ideal')),
    array(select jsonb_array_elements_text(payload->'benefits')),
    payload->'prices', payload->>'icon', (payload->>'hue')::smallint,
    (payload->>'sort_order')::integer, (payload->>'published')::boolean,
    array(select jsonb_array_elements_text(payload->'test_ids'))
  )
  on conflict (id) do update set
    name = excluded.name, tag = excluded.tag, category = excluded.category,
    tagline = excluded.tagline, ideal = excluded.ideal, benefits = excluded.benefits,
    prices = excluded.prices, icon = excluded.icon,
    hue = excluded.hue, sort_order = excluded.sort_order, published = excluded.published,
    test_ids = excluded.test_ids, updated_at = now();

  delete from profile_sub_profiles where profile_id = payload->>'id';

  insert into profile_sub_profiles (profile_id, sub_profile_id, sort_order)
  select payload->>'id', (v #>> '{}')::bigint, (ord - 1)::integer
  from jsonb_array_elements(payload->'sub_profile_ids') with ordinality as t(v, ord);
end;
$$;

revoke execute on function public.save_profile(jsonb) from public, anon, authenticated;

commit;
