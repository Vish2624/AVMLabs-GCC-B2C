-- Starting data: the eight profiles the site shipped with.
-- Each profile's tests are grouped into sub-profiles by body area.
-- Run after migrations/0001_profiles.sql.

begin;

insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('essential', 'Essential Wellness', 'Wellness', 'wellness', 'Your yearly health baseline — in one sample.', 1299, 'shield-plus', 275, 0, true);
insert into public.sub_profiles (profile_id, name, description, test_ids, sort_order) values
  ('essential', 'Blood', '', array['cbc']::text[], 0),
  ('essential', 'Heart', '', array['lipid']::text[], 1),
  ('essential', 'Liver', '', array['lft']::text[], 2),
  ('essential', 'Kidney', '', array['kft', 'urine']::text[], 3),
  ('essential', 'Diabetes', '', array['fbs']::text[], 4),
  ('essential', 'Thyroid', '', array['tsh']::text[], 5);

insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('vitamin', 'Vitamin Check', 'Vitamins', 'vitamins', 'Low energy, hair fall or body aches? Start here.', 1899, 'pill', 75, 1, true);
insert into public.sub_profiles (profile_id, name, description, test_ids, sort_order) values
  ('vitamin', 'Vitamins', '', array['vitd', 'b12', 'folate', 'calcium', 'iron', 'ferritin']::text[], 0);

insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('thyroid', 'Thyroid Plus', 'Thyroid', 'thyroid', 'Weight changes, mood swings or feeling cold?', 1499, 'zap', 195, 2, true);
insert into public.sub_profiles (profile_id, name, description, test_ids, sort_order) values
  ('thyroid', 'Thyroid', '', array['thyroid', 'antitpo']::text[], 0),
  ('thyroid', 'Blood', '', array['cbc']::text[], 1),
  ('thyroid', 'Heart', '', array['lipid']::text[], 2);

insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('women', 'Women''s Hormone Profile', 'Women', 'women', 'Cycles, fertility & energy — understand your hormones.', 2999, 'flower-2', 345, 3, true);
insert into public.sub_profiles (profile_id, name, description, test_ids, sort_order) values
  ('women', 'Hormones', '', array['fsh', 'lh', 'prolactin', 'estradiol', 'amh']::text[], 0),
  ('women', 'Thyroid', '', array['tsh']::text[], 1);

insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('pcos', 'PCOS Profile', 'Women', 'women', 'Acne, irregular periods or weight gain? Get clarity.', 2799, 'flower', 320, 4, true);
insert into public.sub_profiles (profile_id, name, description, test_ids, sort_order) values
  ('pcos', 'Hormones', '', array['fsh', 'lh', 'prolactin', 'testo', 'dheas']::text[], 0),
  ('pcos', 'Diabetes', '', array['insulin', 'fbs']::text[], 1),
  ('pcos', 'Thyroid', '', array['tsh']::text[], 2),
  ('pcos', 'Heart', '', array['lipid']::text[], 3);

insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('men', 'Men''s Vitality', 'Men', 'men', 'Energy, stamina and long-term health — measured.', 2699, 'biceps-flexed', 245, 5, true);
insert into public.sub_profiles (profile_id, name, description, test_ids, sort_order) values
  ('men', 'Hormones', '', array['testo', 'cortisol']::text[], 0),
  ('men', 'Thyroid', '', array['tsh']::text[], 1),
  ('men', 'Diabetes', '', array['hba1c']::text[], 2),
  ('men', 'Heart', '', array['lipid']::text[], 3),
  ('men', 'Vitamins', '', array['vitd']::text[], 4),
  ('men', 'Men''s Health', '', array['psa']::text[], 5);

insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('diabetes', 'Diabetes Care', 'Diabetes', 'diabetes', 'Track sugar control and protect heart & kidneys.', 1599, 'syringe', 150, 6, true);
insert into public.sub_profiles (profile_id, name, description, test_ids, sort_order) values
  ('diabetes', 'Diabetes', '', array['fbs', 'hba1c', 'insulin']::text[], 0),
  ('diabetes', 'Heart', '', array['lipid']::text[], 1),
  ('diabetes', 'Kidney', '', array['kft', 'urine']::text[], 2);

insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('fullbody', 'Full Body Advanced', 'Wellness', 'wellness', 'Head-to-toe checkup with vitamins & inflammation.', 3499, 'activity', 25, 7, true);
insert into public.sub_profiles (profile_id, name, description, test_ids, sort_order) values
  ('fullbody', 'Blood', '', array['cbc']::text[], 0),
  ('fullbody', 'Heart', '', array['lipid', 'crp']::text[], 1),
  ('fullbody', 'Liver', '', array['lft']::text[], 2),
  ('fullbody', 'Kidney', '', array['kft', 'urine']::text[], 3),
  ('fullbody', 'Thyroid', '', array['thyroid']::text[], 4),
  ('fullbody', 'Diabetes', '', array['hba1c', 'fbs']::text[], 5),
  ('fullbody', 'Vitamins', '', array['vitd', 'b12', 'iron']::text[], 6);

commit;
