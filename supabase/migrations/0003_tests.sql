-- Lab tests, managed in the admin. Each test lists the parameters it measures and,
-- optionally, calculated parameters (worked out from other results, e.g. LDL / HDL Ratio).
-- Sub-profiles and profiles refer to tests by id.
--
-- Run after 0002_sub_profile_library.sql. Fills the table with the tests the site
-- shipped with (src/data/tests.json). Until this runs, the site keeps using that file.

create table public.tests (
  id          text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  short       text not null,
  categories  text[] not null default '{}',
  price       integer not null check (price >= 0),
  mrp         integer not null check (mrp >= 0),
  tat         text not null default '24 hrs',
  fasting     boolean not null default false,
  sample      text not null default 'Blood',
  aka         text not null default '',
  about       text not null default '',
  parameters  text[] not null default '{}',
  calculated  text[] not null default '{}',
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.tests enable row level security;

insert into public.tests (id, name, short, categories, price, mrp, tat, fasting, sample, aka, about, parameters, calculated, sort_order) values
  ('vitd', 'Vitamin D (25-OH)', 'Vitamin D', array['vitamins', 'bone']::text[], 699, 1500, '24 hrs', false, 'Blood', '25-Hydroxy Vitamin D, Vitamin D Total, Calcidiol', 'Measures the main form of vitamin D circulating in your blood. Low levels are common and linked to fatigue, bone pain, hair fall and low immunity.', array['25-OH Vitamin D (D2 + D3)']::text[], array[]::text[], 0),
  ('b12', 'Vitamin B12', 'Vitamin B12', array['vitamins']::text[], 549, 1100, '24 hrs', false, 'Blood', 'Cobalamin, Cyanocobalamin', 'Checks your vitamin B12 level, needed for healthy nerves and red blood cells. Low B12 can cause tiredness, tingling, poor memory and anaemia.', array['Vitamin B12 (Cobalamin)']::text[], array[]::text[], 1),
  ('folate', 'Folic Acid (Vitamin B9)', 'Folate', array['vitamins']::text[], 549, 1000, '24 hrs', false, 'Blood', 'Folate, Vitamin B9, Serum Folic Acid', 'Measures folate, essential for making red blood cells and for a healthy pregnancy. Often tested together with B12.', array['Folic Acid (Serum)']::text[], array[]::text[], 2),
  ('calcium', 'Calcium, Serum', 'Calcium', array['vitamins', 'bone']::text[], 199, 350, '12 hrs', false, 'Blood', 'Serum Calcium, Total Calcium', 'Measures calcium in your blood — important for bones, muscles, nerves and the heart.', array['Calcium, Total']::text[], array[]::text[], 3),
  ('iron', 'Iron Studies', 'Iron Studies', array['vitamins', 'blood']::text[], 699, 1200, '24 hrs', true, 'Blood', 'Iron Profile, Iron Panel', 'Checks how much iron you have and how well your body stores and carries it. Helps find iron-deficiency anaemia or iron overload.', array['Serum Iron', 'TIBC (Total Iron Binding Capacity)', 'UIBC']::text[], array['Transferrin Saturation']::text[], 4),
  ('ferritin', 'Ferritin', 'Ferritin', array['vitamins', 'blood']::text[], 499, 900, '24 hrs', false, 'Blood', 'Serum Ferritin', 'Ferritin shows your stored iron. Low ferritin is the earliest sign of iron deficiency — a common cause of hair fall and tiredness.', array['Ferritin']::text[], array[]::text[], 5),
  ('cbc', 'Complete Blood Count (CBC)', 'CBC', array['blood']::text[], 299, 500, '8 hrs', false, 'Blood', 'Complete Haemogram, Full Blood Count, CBC with ESR', 'A broad screen of your red cells, white cells and platelets. Helps detect anaemia, infection, inflammation and many other conditions.', array['Haemoglobin', 'RBC Count', 'Haematocrit (PCV)', 'MCV', 'MCH', 'MCHC', 'RDW-CV', 'RDW-SD', 'Total WBC Count', 'Neutrophils %', 'Lymphocytes %', 'Monocytes %', 'Eosinophils %', 'Basophils %', 'Absolute Neutrophil Count', 'Absolute Lymphocyte Count', 'Absolute Monocyte Count', 'Absolute Eosinophil Count', 'Absolute Basophil Count', 'Platelet Count', 'MPV', 'PDW', 'PCT', 'ESR']::text[], array[]::text[], 6),
  ('thyroid', 'Thyroid Profile (T3, T4, TSH)', 'Thyroid Profile', array['thyroid', 'hormones']::text[], 449, 800, '12 hrs', false, 'Blood', 'Thyroid Function Test, TFT, T3 T4 TSH', 'Checks how well your thyroid gland is working. Helps detect an under-active or over-active thyroid.', array['Total T3 (Triiodothyronine)', 'Total T4 (Thyroxine)', 'TSH (Thyroid Stimulating Hormone)']::text[], array[]::text[], 7),
  ('tsh', 'TSH (Ultrasensitive)', 'TSH', array['thyroid', 'hormones']::text[], 249, 400, '12 hrs', false, 'Blood', 'Thyroid Stimulating Hormone, Ultrasensitive TSH', 'The most sensitive first test for thyroid problems, and for monitoring thyroid medication.', array['TSH (Ultrasensitive)']::text[], array[]::text[], 8),
  ('antitpo', 'Anti-TPO Antibodies', 'Anti-TPO', array['thyroid']::text[], 899, 1600, '48 hrs', false, 'Blood', 'Thyroid Peroxidase Antibody, TPO Antibody', 'Detects antibodies that attack the thyroid. Helps diagnose autoimmune thyroid conditions such as Hashimoto''s.', array['Anti-Thyroid Peroxidase (Anti-TPO)']::text[], array[]::text[], 9),
  ('hba1c', 'HbA1c (Glycosylated Haemoglobin)', 'HbA1c', array['diabetes']::text[], 399, 650, '8 hrs', false, 'Blood', 'Glycated Haemoglobin, A1c, Glyco Hb, Diabetes Test', 'Shows your average blood sugar over the past 2–3 months. Used to diagnose diabetes and check how well it is being controlled.', array['Glycosylated Haemoglobin (HbA1c)', 'Mean Blood Glucose']::text[], array[]::text[], 10),
  ('fbs', 'Glucose, Fasting', 'Fasting Glucose', array['diabetes']::text[], 99, 150, '6 hrs', true, 'Blood', 'Fasting Blood Sugar, FBS, Fasting Plasma Glucose', 'Measures your blood sugar after an overnight fast. A basic screen for diabetes and prediabetes.', array['Glucose, Fasting (Plasma)']::text[], array[]::text[], 11),
  ('insulin', 'Insulin, Fasting', 'Fasting Insulin', array['diabetes', 'hormones']::text[], 649, 1000, '24 hrs', true, 'Blood', 'Fasting Insulin, Serum Insulin', 'Measures insulin after fasting. Helps spot insulin resistance — common with PCOS, weight gain and prediabetes.', array['Insulin, Fasting']::text[], array[]::text[], 12),
  ('lipid', 'Lipid Profile', 'Lipid Profile', array['heart']::text[], 499, 900, '12 hrs', true, 'Blood', 'Cholesterol Test, Lipid Panel', 'Measures cholesterol and fats in your blood to assess your risk of heart disease and stroke.', array['Total Cholesterol', 'Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol', 'VLDL Cholesterol', 'Non-HDL Cholesterol']::text[], array['Total Cholesterol / HDL Ratio', 'LDL / HDL Ratio', 'HDL / LDL Ratio']::text[], 13),
  ('crp', 'hs-CRP (Inflammation)', 'hs-CRP', array['heart']::text[], 449, 800, '12 hrs', false, 'Blood', 'High-Sensitivity C-Reactive Protein, hsCRP', 'Detects low-grade inflammation in the body and helps assess heart risk.', array['hs-CRP']::text[], array[]::text[], 14),
  ('lft', 'Liver Function Test (LFT)', 'LFT', array['liver']::text[], 599, 1000, '12 hrs', false, 'Blood', 'Liver Panel, Liver Profile, LFT', 'Checks how well your liver is working and looks for liver inflammation or damage.', array['Bilirubin, Total', 'Bilirubin, Direct', 'Bilirubin, Indirect', 'SGOT (AST)', 'SGPT (ALT)', 'Alkaline Phosphatase', 'GGT', 'Total Protein', 'Albumin', 'Globulin']::text[], array['AST / ALT Ratio', 'A / G Ratio']::text[], 15),
  ('kft', 'Kidney Function Test (KFT)', 'KFT', array['kidney']::text[], 599, 1000, '12 hrs', false, 'Blood', 'Renal Function Test, RFT, Kidney Panel', 'Checks how well your kidneys filter waste and balance salts in the blood.', array['Urea', 'Blood Urea Nitrogen (BUN)', 'Creatinine', 'Uric Acid', 'Calcium', 'Sodium', 'Potassium', 'Chloride', 'eGFR']::text[], array['BUN / Creatinine Ratio']::text[], 16),
  ('urine', 'Urine Routine & Microscopy', 'Urine Routine', array['kidney']::text[], 149, 300, '8 hrs', false, 'Urine', 'Urine R/M, Urine Analysis, Urinalysis', 'A routine check of your urine. Helps detect urinary infections, kidney problems and diabetes.', array['Colour', 'Appearance', 'Specific Gravity', 'pH', 'Protein', 'Glucose', 'Ketones', 'Bilirubin', 'Urobilinogen', 'Blood', 'Nitrite', 'Leucocyte Esterase', 'Pus Cells', 'RBCs', 'Epithelial Cells', 'Casts', 'Crystals', 'Bacteria', 'Yeast', 'Mucus']::text[], array[]::text[], 17),
  ('testo', 'Testosterone, Total', 'Testosterone', array['hormones', 'men']::text[], 699, 1200, '24 hrs', false, 'Blood', 'Total Testosterone, Serum Testosterone', 'Measures testosterone — linked to energy, mood, muscle and libido in men, and to PCOS in women.', array['Testosterone, Total']::text[], array[]::text[], 18),
  ('cortisol', 'Cortisol, Morning', 'Cortisol', array['hormones']::text[], 549, 900, '24 hrs', false, 'Blood', 'Serum Cortisol, Stress Hormone Test', 'Measures cortisol, your main stress hormone. Best taken in the morning.', array['Cortisol (Morning)']::text[], array[]::text[], 19),
  ('psa', 'PSA, Total', 'PSA', array['men']::text[], 599, 1000, '24 hrs', false, 'Blood', 'Prostate Specific Antigen, Total PSA', 'A screening test for prostate health, usually recommended for men over 50.', array['PSA, Total']::text[], array[]::text[], 20),
  ('fsh', 'FSH (Follicle Stimulating Hormone)', 'FSH', array['hormones', 'women']::text[], 449, 700, '24 hrs', false, 'Blood', 'Follicle Stimulating Hormone', 'Helps assess fertility, menstrual problems and menopause.', array['FSH']::text[], array[]::text[], 21),
  ('lh', 'LH (Luteinizing Hormone)', 'LH', array['hormones', 'women']::text[], 449, 700, '24 hrs', false, 'Blood', 'Luteinizing Hormone', 'Helps assess ovulation, fertility and PCOS. Often tested with FSH.', array['LH']::text[], array[]::text[], 22),
  ('prolactin', 'Prolactin', 'Prolactin', array['hormones', 'women']::text[], 499, 800, '24 hrs', false, 'Blood', 'Serum Prolactin, PRL', 'High prolactin can cause irregular periods, infertility and breast discharge.', array['Prolactin']::text[], array[]::text[], 23),
  ('estradiol', 'Estradiol (E2)', 'Estradiol', array['hormones', 'women']::text[], 649, 1000, '24 hrs', false, 'Blood', 'E2, Oestradiol', 'Measures the main female hormone. Helps assess cycles, fertility and menopause.', array['Estradiol (E2)']::text[], array[]::text[], 24),
  ('amh', 'AMH (Anti-Müllerian Hormone)', 'AMH', array['hormones', 'women']::text[], 1799, 2800, '48 hrs', false, 'Blood', 'Anti-Müllerian Hormone, Egg Reserve Test', 'Estimates your ovarian (egg) reserve. Useful when planning pregnancy and in PCOS.', array['AMH']::text[], array[]::text[], 25),
  ('dheas', 'DHEA-S', 'DHEA-S', array['hormones', 'women']::text[], 849, 1400, '24 hrs', false, 'Blood', 'Dehydroepiandrosterone Sulphate', 'Checks adrenal hormone levels. Often tested for PCOS, acne and excess hair growth.', array['DHEA-S']::text[], array[]::text[], 26);
