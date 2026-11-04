-- New B2C profiles from "New B2C Rates" (27 profiles), and the lab code and short name of
-- every test and profile. Codes and short names are for the lab and the admin only: the website
-- never shows them, and the public API leaves them out.
--
-- Run after 0005_profile_benefits.sql. In one transaction it:
--   1. adds code and short_name to tests and profiles, and fills them in for the 122 tests;
--   2. deletes every profile and sub-profile;
--   3. adds the shared panels (Kidney, Liver, Lipid, Free Thyroid, Total Thyroid, Cardiac Risk
--      Markers, Pancreatic = Amylase + Lipase) and the 27 profiles with their offer prices.
--      A profile's report time is the longest of its tests', worked out by the website;
--   4. adds in_reels: whether a profile is in the reels and the home reel row (all are on the
--      Profiles page). The single panels (Lipid, Liver, Kidney, Iron, Free and Total Thyroid) are not;
--   5. updates save_profile to store code, short_name and in_reels.
-- Generated from src/data/profiles.json; the two must stay the same.

begin;

-- 1. Codes.
alter table public.tests
  add column code text not null default '',
  add column short_name text not null default '';
alter table public.profiles
  add column code text not null default '',
  add column short_name text not null default '',
  add column in_reels boolean not null default true;

update public.tests t set code = v.code, short_name = v.short_name
from (values
  ('cbc', 'HEMOGRAM - 6 PART (DIFF)', 'H6'),
  ('tsh', 'TSH', 'TSH'),
  ('fbs', 'FBS', 'FBS'),
  ('hba1c', 'HBA', 'HBA'),
  ('urine', 'COMPLETE URINE ANALYSIS', 'CUA'),
  ('creatinine', 'SCRE', 'SCRE'),
  ('ppbs', 'PPBS', 'PPBS'),
  ('sgpt', 'SGPT', 'SGPT'),
  ('vitd', 'VITDC', 'VITDC'),
  ('b12', 'VITB', 'VITB'),
  ('cholesterol', 'CHOL', 'CHOL'),
  ('triglycerides', 'TRIG', 'TRIG'),
  ('hdl', 'HCHO', 'HCHO'),
  ('ldl', 'LDL', 'LDL'),
  ('sgot', 'SGOT', 'SGOT'),
  ('bilirubin-total', 'BILT', 'BILT'),
  ('rbs', 'RBS', 'RBS'),
  ('uric-acid', 'URIC', 'URIC'),
  ('bun', 'BUN', 'BUN'),
  ('t3', 'T3', 'T3'),
  ('t4', 'T4', 'T4'),
  ('ft4', 'FT4', 'FT4'),
  ('ft3', 'FT3', 'FT3'),
  ('electrolytes', 'SERUM ELECTROLYTES', 'SEEL'),
  ('c-reactive-protein', 'CRP', 'CRP'),
  ('calcium', 'CALC', 'CALC'),
  ('hbsag', 'CSAG', 'CSAG'),
  ('alp', 'ALKP', 'ALKP'),
  ('bilirubin-direct', 'BILD', 'BILD'),
  ('albumin', 'SALB', 'SALB'),
  ('total-protein', 'PROT', 'PROT'),
  ('ferritin', 'FERR', 'FERR'),
  ('ggt', 'GGT', 'GGT'),
  ('serum-iron', 'IRON', 'IRON'),
  ('dengue-ns1', 'NS1', 'NS1'),
  ('beta-hcg', 'BHCG', 'BHCG'),
  ('anti-hcv', 'CHCV', 'CHCV'),
  ('hiv', 'CHIV', 'CHIV'),
  ('dengue-igm', 'DG_M', 'DG_M'),
  ('prolactin', 'PRL', 'PRL'),
  ('tibc', 'TIBC', 'TIBC'),
  ('dengue-igg', 'DG_G', 'DG_G'),
  ('psa', 'PSA', 'PSA'),
  ('pbs', 'PERIPHERAL BLOOD SMEAR (PBS)', 'PBS'),
  ('lh', 'LH', 'LH'),
  ('fsh', 'FSH', 'FSH'),
  ('hscrp', 'HSCRP', 'HSCRP'),
  ('rf', 'RFAC', 'RFAC'),
  ('syphilis', 'SYPHIL', 'SYPHILIS'),
  ('microalbumin', 'UALB', 'UALB'),
  ('folate', 'FOLI', 'FOLI'),
  ('testo', 'TEST', 'TEST'),
  ('anti-tpo', 'AMA', 'AMA'),
  ('estradiol', 'E2', 'E2'),
  ('insulin', 'INSFA', 'INSFA'),
  ('amh', 'AMH', 'AMH'),
  ('amylase', 'AMYL', 'AMYL'),
  ('lipase', 'LASE', 'LASE'),
  ('magnesium', 'MG', 'MG'),
  ('phosphorus', 'PHOS', 'PHOS'),
  ('cortisol', 'CORT', 'CORT'),
  ('ana', 'ANA', 'ANA'),
  ('anti-ccp', 'ACCP', 'ACCP'),
  ('homocysteine', 'HOMO', 'HOMO'),
  ('troponin-i', 'HSTNI', 'HSTNI'),
  ('urinogram', 'URINOGRAM', 'UROG'),
  ('lpa', 'LPA', 'LPA'),
  ('nt-probnp', 'NPBNP', 'NPBNP'),
  ('cea', 'CEA', 'CEA'),
  ('ca125', 'CA125', 'CA125'),
  ('progesterone', 'PROG', 'PROG'),
  ('pth', 'PTH', 'PTH'),
  ('anti-hbs', 'HBST', 'HBST'),
  ('cpk', 'CPK', 'CPK'),
  ('ldh', 'LDH', 'LDH'),
  ('apo-b', 'APOB', 'APOB'),
  ('apo-a1', 'APOA', 'APOA'),
  ('ck-mb', 'CPKMB', 'CPKMB'),
  ('ige', 'TIGE', 'TIGE'),
  ('hav-igm', 'HAVM', 'HAVM'),
  ('rubella-igg', 'RB_G', 'RB_G'),
  ('toxo-igg', 'CTX_G', 'CTX_G'),
  ('cmv-igg', 'CCM_G', 'CCM_G'),
  ('toxo-igm', 'CTX_M', 'CTX_M'),
  ('rubella-igm', 'CRB_M', 'CRB_M'),
  ('cmv-igm', 'CCM_M', 'CCM_M'),
  ('anti-tg', 'ATG', 'ATG'),
  ('afp', 'AFP', 'AFP'),
  ('insulin-pp', 'INSPP', 'INSPP'),
  ('free-psa', 'FPSA', 'FPSA'),
  ('hpylori-igg', 'HPYG', 'HPYG'),
  ('ca19-9', 'CA19-9', 'CA19-9'),
  ('ca15-3', 'CA15-3', 'CA15-3'),
  ('dheas', 'DHEA', 'DHEA'),
  ('zinc', 'SEZN', 'SEZN'),
  ('anti-dsdna', 'DNA', 'DNA'),
  ('hbeag', 'EAG', 'EAG'),
  ('anti-hbe', 'AHBE', 'AHBE'),
  ('anti-hbc-igm', 'HBCM', 'HBCM'),
  ('anti-hbc-total', 'HBCT', 'HBCT'),
  ('hsv12-igg', 'HC_G', 'HC_G'),
  ('hsv12-igm', 'HC_M', 'HC_M'),
  ('shbg', 'SHBG', 'SHBG'),
  ('c-peptide', 'CPEP', 'CPEP'),
  ('copper', 'SECU', 'SECU'),
  ('thyroglobulin', 'TG', 'TG'),
  ('hsv2-igg', 'CHS2G', 'CHS2G'),
  ('hsv2-igm', 'CHS2M', 'CHS2M'),
  ('hsv1-igg', 'CHS1G', 'CHS1G'),
  ('hsv1-igm', 'CHS1M', 'CHS1M'),
  ('cardiolipin-igg', 'AC_G', 'AC_G'),
  ('cardiolipin-igm', 'AC_M', 'AC_M'),
  ('17-ohp', '17OH', '17OH'),
  ('growth-hormone', 'HGH', 'HGH'),
  ('hav-total', 'HAVT', 'HAVT'),
  ('calcitonin', 'CALCT', 'CALCT'),
  ('androstenedione', 'ANDR', 'ANDR'),
  ('acth', 'ACTH', 'ACTH'),
  ('aldosterone', 'ALDOS', 'ALDOS'),
  ('renin', 'DREN', 'DREN'),
  ('chlamydia-igm', 'CHL_M', 'CHL_M'),
  ('lp-pla2', 'PLA2', 'PLA2')
) as v(id, code, short_name)
where t.id = v.id;

-- 2. Out with the old profiles and sub-profiles.
delete from public.profile_sub_profiles;
delete from public.profiles;
delete from public.sub_profile_library;

-- 3. Shared panels, then the profiles.
insert into public.sub_profile_library (id, name, description, test_ids) overriding system value values
  (1, 'Kidney Profile', '', array['bun', 'calcium', 'creatinine', 'uric-acid']::text[]),
  (2, 'Liver Profile', '', array['alp', 'bilirubin-direct', 'bilirubin-total', 'ggt', 'total-protein', 'albumin', 'sgot', 'sgpt']::text[]),
  (3, 'Lipid Profile', '', array['cholesterol', 'hdl', 'ldl', 'triglycerides']::text[]),
  (4, 'Free Thyroid Profile', '', array['ft3', 'ft4', 'tsh']::text[]),
  (5, 'Total Thyroid Profile', '', array['t3', 't4', 'tsh']::text[]),
  (6, 'Cardiac Risk Markers', '', array['apo-a1', 'apo-b', 'hscrp', 'lpa', 'homocysteine']::text[]),
  (7, 'Pancreatic Profile', '', array['amylase', 'lipase']::text[]);

select setval(pg_get_serial_sequence('public.sub_profile_library', 'id'), (select max(id) from public.sub_profile_library));

insert into public.profiles (id, code, short_name, name, tag, category, tagline, ideal, benefits, prices, icon, hue, sort_order, published, in_reels, test_ids) values
  ('essential-wellness', 'EW_PRO', 'EW_PRO', 'Essential Wellness', 'Wellness', 'wellness', 'Your yearly health baseline: liver, kidney, cholesterol, thyroid and sugar in one sample.',
   array['Adults 18+', 'Annual check-up', 'No symptoms']::text[],
   array['Screens liver, kidney, heart, thyroid and sugar', 'Catch silent issues before they show up', 'A baseline to compare next year against']::text[],
   '{"AE":69,"SA":69,"BH":7}'::jsonb, 'shield-plus', 275, 0, true, true, array['hba1c', 'fbs']::text[]),
  ('essential-wellness-plus', 'EWP_PRO', 'EWP_PRO', 'Essential Wellness Plus', 'Wellness', 'wellness', 'Essential Wellness plus Vitamin D, B12 and folate.',
   array['Adults 18+', 'Low energy', 'Indoor lifestyle']::text[],
   array['Everything in Essential Wellness', 'Adds Vitamin D, B12 and folate', 'Finds common deficiencies behind tiredness']::text[],
   '{"AE":125,"SA":125,"BH":14}'::jsonb, 'shield-check', 245, 1, true, true, array['hba1c', 'fbs', 'vitd', 'b12', 'folate']::text[]),
  ('advance-wellness', 'AW_PRO', 'AW_PRO', 'Advance Wellness', 'Wellness', 'wellness', 'A fuller check-up: blood count, iron stores, urine and pancreas on top of Essential Wellness Plus.',
   array['Adults 30+', 'Yearly full check-up', 'Busy schedules']::text[],
   array['Everything in Essential Wellness Plus', 'Adds blood count, iron, ferritin and urine tests', 'Includes pancreas enzymes (amylase, lipase)']::text[],
   '{"AE":205,"SA":205,"BH":22}'::jsonb, 'activity', 25, 2, true, true, array['hba1c', 'fbs', 'vitd', 'b12', 'folate', 'ferritin', 'urinogram', 'urine', 'cbc', 'serum-iron', 'tibc']::text[]),
  ('advance-wellness-plus', 'AWP__PRO', 'AWP__PRO', 'Advance Wellness Plus', 'Wellness', 'wellness', 'Our most complete check-up, with heart risk markers, minerals and insulin.',
   array['Adults 35+', 'Family history of heart disease', 'Complete yearly check-up']::text[],
   array['Everything in Advance Wellness', 'Adds cardiac risk markers and insulin', 'Electrolytes, copper and zinc included']::text[],
   '{"AE":435,"SA":435,"BH":45}'::jsonb, 'sparkles', 150, 3, true, true, array['hba1c', 'fbs', 'vitd', 'b12', 'folate', 'ferritin', 'urinogram', 'urine', 'cbc', 'serum-iron', 'tibc', 'electrolytes', 'copper', 'zinc', 'insulin']::text[]),
  ('women-complete-wellness', 'WCW_PRO', 'WCW_PRO', 'Women Complete Wellness', 'Women', 'women', 'A complete women''s health check-up, with key hormones, vitamins and iron.',
   array['Women 18+', 'Yearly check-up', 'Low energy or hair fall']::text[],
   array['Liver, kidney, cholesterol, thyroid and sugar', 'Vitamin D, B12, folate and iron stores', 'Prolactin, FSH and LH hormones']::text[],
   '{"AE":210,"SA":210,"BH":22}'::jsonb, 'flower-2', 345, 4, true, true, array['cbc', 'serum-iron', 'tibc', 'ferritin', 'hba1c', 'fbs', 'vitd', 'b12', 'folate', 'electrolytes', 'prolactin', 'fsh', 'lh']::text[]),
  ('men-complete-wellness', 'MCW_PRO', 'MCW_PRO', 'Men Complete Wellness', 'Men', 'men', 'A complete men''s health check-up, with testosterone and PSA.',
   array['Men 18+', 'Yearly check-up', 'Low energy']::text[],
   array['Liver, kidney, cholesterol, thyroid and sugar', 'Vitamin D, B12, folate and iron stores', 'Testosterone and PSA included']::text[],
   '{"AE":199,"SA":199,"BH":20}'::jsonb, 'biceps-flexed', 245, 5, true, true, array['cbc', 'serum-iron', 'tibc', 'ferritin', 'hba1c', 'fbs', 'vitd', 'b12', 'folate', 'electrolytes', 'psa', 'testo']::text[]),
  ('womens-platinum-health', 'WPH_PRO', 'WPH_PRO', 'Women''s Platinum Health', 'Women', 'women', 'Women Complete Wellness plus cancer markers, AMH and thyroid antibodies.',
   array['Women 30+', 'Family history', 'Most thorough check-up']::text[],
   array['Everything in Women Complete Wellness', 'Adds CA 125, CA 15.3 and CEA markers', 'AMH, thyroid antibodies, PTH and hs-CRP']::text[],
   '{"AE":505,"SA":505,"BH":52}'::jsonb, 'ribbon', 320, 6, true, true, array['cbc', 'serum-iron', 'tibc', 'ferritin', 'hba1c', 'fbs', 'vitd', 'b12', 'folate', 'electrolytes', 'prolactin', 'fsh', 'lh', 'amh', 'ca125', 'ca15-3', 'cea', 'anti-tg', 'anti-tpo', 'pth', 'hscrp']::text[]),
  ('mens-platinum-health', 'MALE _PH_PRO', 'MALE _PH_PRO', 'Men''s Platinum Health', 'Men', 'men', 'Men Complete Wellness plus cancer markers, heart risk and bone health.',
   array['Men 40+', 'Family history', 'Most thorough check-up']::text[],
   array['Everything in Men Complete Wellness', 'Adds free PSA, CEA, AFP and CA 19.9', 'hs-CRP, homocysteine and PTH']::text[],
   '{"AE":409,"SA":409,"BH":42}'::jsonb, 'shield-plus', 275, 7, true, true, array['cbc', 'serum-iron', 'tibc', 'ferritin', 'hba1c', 'fbs', 'vitd', 'b12', 'folate', 'electrolytes', 'psa', 'testo', 'free-psa', 'cea', 'afp', 'ca19-9', 'hscrp', 'homocysteine', 'pth']::text[]),
  ('women-hormone-plus', 'WOMEN _ HPP_PRO', 'WOMEN _ HPP_PRO', 'Women Hormone Profile Plus', 'Women', 'women', 'Cycles, fertility and energy: your key hormones, including AMH, in one blood draw.',
   array['Irregular cycles', 'Planning pregnancy', 'Age 25–45']::text[],
   array['Key reproductive hormones in one draw', 'AMH gives a view of ovarian reserve', 'Best taken on day 2–5 of your cycle']::text[],
   '{"AE":270,"SA":270,"BH":27}'::jsonb, 'flower', 345, 8, true, true, array['fsh', 'lh', 'prolactin', 'estradiol', 'progesterone', 'testo', 'shbg', 'dheas', 'amh']::text[]),
  ('male-hormone', 'MALE_HP_PRO', 'MALE_HP_PRO', 'Male Hormone Profile', 'Men', 'men', 'Energy, stamina and mood: testosterone and the hormones that work with it.',
   array['Low energy', 'Men 30+', 'Stress and sleep issues']::text[],
   array['Testosterone, SHBG and DHEA-S together', 'Thyroid, prolactin and cortisol included', 'PSA screening included']::text[],
   '{"AE":180,"SA":180,"BH":20}'::jsonb, 'atom', 245, 9, true, true, array['fsh', 'lh', 'prolactin', 'testo', 'estradiol', 'shbg', 'dheas', 'psa', 'cortisol']::text[]),
  ('diabetes-monitoring', 'DIA_MP_PRO', 'DIA_MP_PRO', 'Diabetes Monitoring Profile', 'Diabetes', 'diabetes', 'Track sugar control and protect your kidneys, liver and heart.',
   array['Diabetic or pre-diabetic', 'Family history', 'Every 3 months']::text[],
   array['HbA1c shows your 3-month average', 'Kidney and urine checks for early damage', 'Fasting insulin shows resistance early']::text[],
   '{"AE":130,"SA":130,"BH":13}'::jsonb, 'syringe', 150, 10, true, true, array['cbc', 'urine', 'fbs', 'insulin', 'hba1c', 'urinogram', 'b12']::text[]),
  ('heart-health-check', 'HHC_PRO', 'HHC_PRO', 'Heart Health Check', 'Heart', 'heart', 'Cholesterol plus advanced heart risk markers, sugar and kidney function.',
   array['Adults 35+', 'High cholesterol', 'Family history of heart disease']::text[],
   array['Lipid profile with Apo A1, Apo B and Lp(a)', 'hs-CRP and homocysteine for inflammation', 'Sugar, electrolytes and kidney function']::text[],
   '{"AE":185,"SA":185,"BH":20}'::jsonb, 'heart-pulse', 25, 11, true, true, array['hba1c', 'fbs', 'electrolytes']::text[]),
  ('cardiac-risk-markers', 'CRM', 'CRM', 'Cardiac Risk Markers', 'Heart', 'heart', 'Advanced heart risk markers beyond a routine cholesterol test.',
   array['Family history of heart disease', 'Normal cholesterol, still at risk', 'Adults 35+']::text[],
   array['Apo A1, Apo B and Lipoprotein (a)', 'hs-CRP for inflammation', 'Homocysteine included']::text[],
   '{"AE":160,"SA":160,"BH":16}'::jsonb, 'scan-heart', 345, 12, true, true, array['apo-a1', 'apo-b', 'hscrp', 'lpa', 'homocysteine']::text[]),
  ('vitamin-profile', 'VITAMINS PACKAGE', 'VP', 'Vitamin Profile', 'Vitamins', 'vitamins', 'Tired, aching or losing hair? Check Vitamin D, B12 and folate.',
   array['Fatigue', 'Hair fall', 'Desk jobs', 'Vegetarian diets']::text[],
   array['Find deficiencies behind tiredness and aches', 'Vitamin D, B12 and folate together', 'Know exactly what to supplement']::text[],
   '{"AE":65,"SA":65,"BH":6.5}'::jsonb, 'pill', 75, 13, true, true, array['vitd', 'b12', 'folate']::text[]),
  ('hair-fall-essential', 'EHFP_PRO', 'EHFP_PRO', 'Essential Hair Fall Profile', 'Hair fall', 'hair', 'Losing hair? Check the common causes: vitamins, iron, zinc and thyroid.',
   array['Hair thinning', 'Hair fall after illness', 'Women and men']::text[],
   array['Vitamin D, B12 and zinc', 'Iron, TIBC and ferritin for iron stores', 'TSH and blood count included']::text[],
   '{"AE":123,"SA":123,"BH":13}'::jsonb, 'sparkles', 320, 14, true, true, array['cbc', 'vitd', 'b12', 'zinc', 'serum-iron', 'tibc', 'tsh', 'ferritin']::text[]),
  ('hair-fall-comprehensive', 'CHFP_PRO', 'CHFP_PRO', 'Comprehensive Hair Fall Profile', 'Hair fall', 'hair', 'Essential Hair Fall plus free thyroid hormones and folate.',
   array['Ongoing hair fall', 'Thyroid concerns', 'Women and men']::text[],
   array['Everything in Essential Hair Fall', 'Adds Free T3, Free T4 and folate', 'A fuller look at thyroid and vitamins']::text[],
   '{"AE":149,"SA":149,"BH":15}'::jsonb, 'leaf', 150, 15, true, true, array['cbc', 'vitd', 'b12', 'zinc', 'serum-iron', 'tibc', 'tsh', 'ferritin', 'ft3', 'ft4', 'folate']::text[]),
  ('thyro-5', 'THYRO 5', 'TH 5AE122', 'Thyro 5', 'Thyroid', 'thyroid', 'Weight changes, mood swings or feeling cold? Total and free thyroid hormones with TSH.',
   array['Weight changes', 'Hair thinning', 'Family history']::text[],
   array['Total and free T3 and T4 with TSH', 'The fullest thyroid hormone check', 'One sample, no fasting']::text[],
   '{"AE":35,"SA":35,"BH":4}'::jsonb, 'zap', 195, 16, true, true, array['t3', 't4', 'tsh', 'ft3', 'ft4']::text[]),
  ('free-thyroid', 'FREE THYROID', 'FTFT', 'Free Thyroid Profile', 'Thyroid', 'thyroid', 'Free T3, Free T4 and TSH: how your thyroid is working right now.',
   array['Tiredness', 'Weight changes', 'On thyroid medicine']::text[],
   array['Free hormones are not affected by binding proteins', 'Includes TSH', 'No fasting needed']::text[],
   '{"AE":22,"SA":22,"BH":3}'::jsonb, 'zap', 195, 17, true, false, array['ft3', 'ft4', 'tsh']::text[]),
  ('total-thyroid', 'TOTAL THYROID', 'TFT', 'Total Thyroid Profile', 'Thyroid', 'thyroid', 'The routine thyroid check: Total T3, Total T4 and TSH.',
   array['Routine check-up', 'Tiredness', 'Weight changes']::text[],
   array['T3, T4 and TSH together', 'Screens for an under- or over-active thyroid', 'No fasting needed']::text[],
   '{"AE":18,"SA":18,"BH":2}'::jsonb, 'zap', 195, 18, true, false, array['t3', 't4', 'tsh']::text[]),
  ('back-to-school-essential', 'BSE_PRO', 'BSE_PRO', 'Back to School Essential', 'Kids', 'kids', 'A simple health check before the school year: blood count, Vitamin D, iron and thyroid.',
   array['School-age children', 'Start of the school year', 'Tiredness or low appetite']::text[],
   array['Blood count to check for anaemia', 'Vitamin D, iron and ferritin', 'TSH for thyroid']::text[],
   '{"AE":63,"SA":63,"BH":7}'::jsonb, 'baby', 75, 19, true, true, array['cbc', 'vitd', 'serum-iron', 'tsh', 'ferritin']::text[]),
  ('back-to-school-advanced', 'BSA_PRO', 'BSA_PRO', 'Back to School Advanced', 'Kids', 'kids', 'Back to School Essential plus liver, kidney, cholesterol, sugar and urine tests.',
   array['School-age children', 'Yearly check-up', 'Before sports']::text[],
   array['Everything in Back to School Essential', 'Adds liver, kidney and cholesterol', 'Urine, CRP, B12 and sugar included']::text[],
   '{"AE":139,"SA":139,"BH":14}'::jsonb, 'person-standing', 25, 20, true, true, array['cbc', 'vitd', 'serum-iron', 'tsh', 'ferritin', 'c-reactive-protein', 'urine', 'b12', 'rbs', 'electrolytes']::text[]),
  ('pre-marital-screening', 'PMS_PRO', 'PMS_PRO', 'Pre Marital Screening', 'Screening', 'screening', 'Screening for couples before marriage: blood, infections and rubella immunity.',
   array['Couples planning marriage', 'Planning a family']::text[],
   array['Blood count and blood smear', 'Hepatitis B, hepatitis C, HIV and syphilis', 'Rubella immunity (IgG)']::text[],
   '{"AE":110,"SA":110,"BH":11}'::jsonb, 'users', 345, 21, true, true, array['cbc', 'pbs', 'hbsag', 'anti-hcv', 'hiv', 'syphilis', 'rubella-igg']::text[]),
  ('pre-employment', 'PRE EMPLOYMENT PROFILE', 'VMP', 'Pre Employment Profile', 'Screening', 'screening', 'The infection screening many employers ask for.',
   array['New job', 'Visa or work permit', 'Employer request']::text[],
   array['HIV, hepatitis B and hepatitis C', 'Syphilis antibody', 'Results in one report']::text[],
   '{"AE":64,"SA":64,"BH":7}'::jsonb, 'stethoscope', 245, 22, true, true, array['hiv', 'hbsag', 'anti-hcv', 'syphilis']::text[]),
  ('lipid-profile', 'LIPID PROFILE', 'LIPID', 'Lipid Profile', 'Heart', 'heart', 'Cholesterol, HDL, LDL and triglycerides.',
   array['Adults 20+', 'Routine check-up', 'High cholesterol']::text[],
   array['Total, HDL and LDL cholesterol', 'Triglycerides', 'Fasting recommended']::text[],
   '{"AE":18,"SA":18,"BH":2}'::jsonb, 'heart', 25, 23, true, false, array['cholesterol', 'hdl', 'ldl', 'triglycerides']::text[]),
  ('liver-profile', 'LIVER FUNCTION TESTS', 'LFT', 'Liver Profile', 'Liver', 'organs', 'How well your liver is working: enzymes, bilirubin and proteins.',
   array['Routine check-up', 'On long-term medicine', 'Alcohol or fatty liver concerns']::text[],
   array['SGOT, SGPT, ALP and GGT enzymes', 'Bilirubin total and direct', 'Total protein and albumin']::text[],
   '{"AE":18,"SA":18,"BH":2}'::jsonb, 'flask-conical', 150, 24, true, false, array['alp', 'bilirubin-direct', 'bilirubin-total', 'ggt', 'total-protein', 'albumin', 'sgot', 'sgpt']::text[]),
  ('kidney-profile', 'KIDNEY FUNCTION TESTS', 'KFT', 'Kidney Profile', 'Kidney', 'organs', 'How well your kidneys are working: creatinine, BUN, uric acid and calcium.',
   array['Routine check-up', 'Diabetes or high blood pressure', 'On long-term medicine']::text[],
   array['Creatinine and BUN', 'Uric acid and calcium', 'One sample, no fasting']::text[],
   '{"AE":15,"SA":15,"BH":1.5}'::jsonb, 'droplet', 195, 25, true, false, array['bun', 'calcium', 'creatinine', 'uric-acid']::text[]),
  ('iron-profile', 'IRON DEFICIENCY', 'IDP', 'Iron Profile', 'Vitamins', 'vitamins', 'Serum iron and TIBC: check for iron deficiency.',
   array['Tiredness', 'Heavy periods', 'Vegetarian diets']::text[],
   array['Serum iron', 'Total iron binding capacity (TIBC)', 'One sample']::text[],
   '{"AE":18,"SA":18,"BH":2}'::jsonb, 'droplet', 25, 26, true, false, array['serum-iron', 'tibc']::text[]);

insert into public.profile_sub_profiles (profile_id, sub_profile_id, sort_order) values
  ('essential-wellness', 2, 0), ('essential-wellness', 3, 1), ('essential-wellness', 1, 2), ('essential-wellness', 4, 3), ('essential-wellness-plus', 2, 0), ('essential-wellness-plus', 3, 1),
  ('essential-wellness-plus', 1, 2), ('essential-wellness-plus', 4, 3), ('advance-wellness', 2, 0), ('advance-wellness', 3, 1), ('advance-wellness', 1, 2), ('advance-wellness', 4, 3),
  ('advance-wellness', 7, 4), ('advance-wellness-plus', 2, 0), ('advance-wellness-plus', 3, 1), ('advance-wellness-plus', 1, 2), ('advance-wellness-plus', 4, 3), ('advance-wellness-plus', 7, 4),
  ('advance-wellness-plus', 6, 5), ('women-complete-wellness', 2, 0), ('women-complete-wellness', 1, 1), ('women-complete-wellness', 3, 2), ('women-complete-wellness', 5, 3), ('women-complete-wellness', 7, 4),
  ('men-complete-wellness', 2, 0), ('men-complete-wellness', 1, 1), ('men-complete-wellness', 3, 2), ('men-complete-wellness', 5, 3), ('men-complete-wellness', 7, 4), ('womens-platinum-health', 2, 0),
  ('womens-platinum-health', 1, 1), ('womens-platinum-health', 3, 2), ('womens-platinum-health', 5, 3), ('womens-platinum-health', 7, 4), ('mens-platinum-health', 2, 0), ('mens-platinum-health', 1, 1),
  ('mens-platinum-health', 3, 2), ('mens-platinum-health', 5, 3), ('mens-platinum-health', 7, 4), ('women-hormone-plus', 4, 0), ('male-hormone', 4, 0), ('diabetes-monitoring', 1, 0),
  ('diabetes-monitoring', 2, 1), ('diabetes-monitoring', 3, 2), ('heart-health-check', 6, 0), ('heart-health-check', 3, 1), ('heart-health-check', 1, 2), ('back-to-school-advanced', 3, 0),
  ('back-to-school-advanced', 2, 1), ('back-to-school-advanced', 1, 2);

-- 5. Saves a profile and replaces its sub-profile links in one transaction.
-- payload: { id, code, short_name, name, tag, category, tagline, ideal: [text], benefits: [text],
--            prices: { AE, SA, BH }, icon, hue, sort_order, published, in_reels, test_ids: [test id], sub_profile_ids: [library id] }
create or replace function public.save_profile(payload jsonb)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into profiles (id, code, short_name, name, tag, category, tagline, ideal, benefits, prices, icon, hue, sort_order, published, in_reels, test_ids)
  values (
    payload->>'id', coalesce(payload->>'code', ''), coalesce(payload->>'short_name', ''),
    payload->>'name', payload->>'tag', payload->>'category', payload->>'tagline',
    array(select jsonb_array_elements_text(payload->'ideal')),
    array(select jsonb_array_elements_text(payload->'benefits')),
    payload->'prices', payload->>'icon', (payload->>'hue')::smallint,
    (payload->>'sort_order')::integer, (payload->>'published')::boolean,
    coalesce((payload->>'in_reels')::boolean, true),
    array(select jsonb_array_elements_text(payload->'test_ids'))
  )
  on conflict (id) do update set
    code = excluded.code, short_name = excluded.short_name,
    name = excluded.name, tag = excluded.tag, category = excluded.category,
    tagline = excluded.tagline, ideal = excluded.ideal, benefits = excluded.benefits,
    prices = excluded.prices, icon = excluded.icon,
    hue = excluded.hue, sort_order = excluded.sort_order, published = excluded.published, in_reels = excluded.in_reels,
    test_ids = excluded.test_ids, updated_at = now();

  delete from profile_sub_profiles where profile_id = payload->>'id';

  insert into profile_sub_profiles (profile_id, sub_profile_id, sort_order)
  select payload->>'id', (v #>> '{}')::bigint, (ord - 1)::integer
  from jsonb_array_elements(payload->'sub_profile_ids') with ordinality as t(v, ord);
end;
$$;

revoke execute on function public.save_profile(jsonb) from public, anon, authenticated;

commit;
