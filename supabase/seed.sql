-- Starting data: reusable sub-profiles and the eight profiles the site shipped with.
-- Run after migrations/0001_profiles.sql and migrations/0002_sub_profile_library.sql.

begin;

insert into public.sub_profile_library (id, name, description, test_ids) overriding system value values
  (1, 'Blood', '', array['cbc']::text[]),
  (2, 'Heart', '', array['lipid']::text[]),
  (3, 'Liver', '', array['lft']::text[]),
  (4, 'Kidney', '', array['kft', 'urine']::text[]),
  (5, 'Diabetes', '', array['fbs']::text[]),
  (6, 'Thyroid', '', array['tsh']::text[]),
  (7, 'Vitamins', '', array['vitd', 'b12', 'folate', 'calcium', 'iron', 'ferritin']::text[]),
  (8, 'Thyroid & Antibodies', '', array['thyroid', 'antitpo']::text[]),
  (9, 'Women''s Hormones', '', array['fsh', 'lh', 'prolactin', 'estradiol', 'amh']::text[]),
  (10, 'PCOS Hormones', '', array['fsh', 'lh', 'prolactin', 'testo', 'dheas']::text[]),
  (11, 'Insulin & Glucose', '', array['insulin', 'fbs']::text[]),
  (12, 'Men''s Hormones', '', array['testo', 'cortisol']::text[]),
  (13, 'HbA1c', '', array['hba1c']::text[]),
  (14, 'Vitamin D', '', array['vitd']::text[]),
  (15, 'Men''s Health', '', array['psa']::text[]),
  (16, 'Diabetes Panel', '', array['fbs', 'hba1c', 'insulin']::text[]),
  (17, 'Heart Advanced', '', array['lipid', 'crp']::text[]),
  (18, 'Thyroid Profile', '', array['thyroid']::text[]),
  (19, 'Sugar Control', '', array['hba1c', 'fbs']::text[]),
  (20, 'Essential Vitamins', '', array['vitd', 'b12', 'iron']::text[]);

select setval(pg_get_serial_sequence('public.sub_profile_library', 'id'), (select max(id) from public.sub_profile_library));

insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('essential', 'Essential Wellness', 'Wellness', 'wellness', 'Your yearly health baseline — in one sample.', 1299, 'shield-plus', 275, 0, true);
insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('vitamin', 'Vitamin Check', 'Vitamins', 'vitamins', 'Low energy, hair fall or body aches? Start here.', 1899, 'pill', 75, 1, true);
insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('thyroid', 'Thyroid Plus', 'Thyroid', 'thyroid', 'Weight changes, mood swings or feeling cold?', 1499, 'zap', 195, 2, true);
insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('women', 'Women''s Hormone Profile', 'Women', 'women', 'Cycles, fertility & energy — understand your hormones.', 2999, 'flower-2', 345, 3, true);
insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('pcos', 'PCOS Profile', 'Women', 'women', 'Acne, irregular periods or weight gain? Get clarity.', 2799, 'flower', 320, 4, true);
insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('men', 'Men''s Vitality', 'Men', 'men', 'Energy, stamina and long-term health — measured.', 2699, 'biceps-flexed', 245, 5, true);
insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('diabetes', 'Diabetes Care', 'Diabetes', 'diabetes', 'Track sugar control and protect heart & kidneys.', 1599, 'syringe', 150, 6, true);
insert into public.profiles (id, name, tag, category, tagline, price, icon, hue, sort_order, published)
values ('fullbody', 'Full Body Advanced', 'Wellness', 'wellness', 'Head-to-toe checkup with vitamins & inflammation.', 3499, 'activity', 25, 7, true);

insert into public.profile_sub_profiles (profile_id, sub_profile_id, sort_order) values
  ('essential', 1, 0), ('essential', 2, 1), ('essential', 3, 2), ('essential', 4, 3), ('essential', 5, 4), ('essential', 6, 5),
  ('vitamin', 7, 0),
  ('thyroid', 8, 0), ('thyroid', 1, 1), ('thyroid', 2, 2),
  ('women', 9, 0), ('women', 6, 1),
  ('pcos', 10, 0), ('pcos', 11, 1), ('pcos', 6, 2), ('pcos', 2, 3),
  ('men', 12, 0), ('men', 6, 1), ('men', 13, 2), ('men', 2, 3), ('men', 14, 4), ('men', 15, 5),
  ('diabetes', 16, 0), ('diabetes', 2, 1), ('diabetes', 4, 2),
  ('fullbody', 1, 0), ('fullbody', 17, 1), ('fullbody', 3, 2), ('fullbody', 4, 3), ('fullbody', 18, 4), ('fullbody', 19, 5), ('fullbody', 20, 6);

commit;
