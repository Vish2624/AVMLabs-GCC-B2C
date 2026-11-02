  static CATS = [
    { id: 'vitamins', label: 'Vitamins', sym: 'Vi', icon: 'pill', hue: 85 }, { id: 'hormones', label: 'Hormones', sym: 'Ho', icon: 'atom', hue: 300 },
    { id: 'thyroid', label: 'Thyroid', sym: 'Th', icon: 'zap', hue: 200 }, { id: 'diabetes', label: 'Diabetes', sym: 'Gl', icon: 'syringe', hue: 240 },
    { id: 'women', label: "Women's Health", sym: 'Wh', icon: 'flower-2', hue: 350 }, { id: 'men', label: "Men's Health", sym: 'Mh', icon: 'biceps-flexed', hue: 255 },
    { id: 'heart', label: 'Heart', sym: 'Ht', icon: 'heart-pulse', hue: 25 }, { id: 'liver', label: 'Liver', sym: 'Lv', icon: 'shield-plus', hue: 45 },
    { id: 'kidney', label: 'Kidney', sym: 'Kd', icon: 'bean', hue: 160 }, { id: 'blood', label: 'Blood', sym: 'Bl', icon: 'droplet', hue: 10 }, { id: 'bone', label: 'Bone', sym: 'Ca', icon: 'bone', hue: 60 }
  ];
  static TESTS = [
    ['vitd', 'Vitamin D (25-OH)', 'Vitamin D', ['vitamins', 'bone'], 1, '24 hrs', 0, 1500, 699],
    ['b12', 'Vitamin B12', 'Vitamin B12', ['vitamins'], 1, '24 hrs', 0, 1100, 549],
    ['folate', 'Folic Acid (Vitamin B9)', 'Folate', ['vitamins'], 1, '24 hrs', 0, 1000, 549],
    ['calcium', 'Calcium, Serum', 'Calcium', ['vitamins', 'bone'], 1, '12 hrs', 0, 350, 199],
    ['iron', 'Iron Studies', 'Iron Studies', ['vitamins', 'blood'], 4, '24 hrs', 1, 1200, 699],
    ['ferritin', 'Ferritin', 'Ferritin', ['vitamins', 'blood'], 1, '24 hrs', 0, 900, 499],
    ['cbc', 'Complete Blood Count (CBC)', 'CBC', ['blood'], 24, '8 hrs', 0, 500, 299],
    ['thyroid', 'Thyroid Profile (T3, T4, TSH)', 'Thyroid Profile', ['thyroid', 'hormones'], 3, '12 hrs', 0, 800, 449],
    ['tsh', 'TSH (Ultrasensitive)', 'TSH', ['thyroid', 'hormones'], 1, '12 hrs', 0, 400, 249],
    ['antitpo', 'Anti-TPO Antibodies', 'Anti-TPO', ['thyroid'], 1, '48 hrs', 0, 1600, 899],
    ['hba1c', 'HbA1c (Glycosylated Haemoglobin)', 'HbA1c', ['diabetes'], 2, '8 hrs', 0, 650, 399],
    ['fbs', 'Glucose, Fasting', 'Fasting Glucose', ['diabetes'], 1, '6 hrs', 1, 150, 99],
    ['insulin', 'Insulin, Fasting', 'Fasting Insulin', ['diabetes', 'hormones'], 1, '24 hrs', 1, 1000, 649],
    ['lipid', 'Lipid Profile', 'Lipid Profile', ['heart'], 9, '12 hrs', 1, 900, 499],
    ['crp', 'hs-CRP (Inflammation)', 'hs-CRP', ['heart'], 1, '12 hrs', 0, 800, 449],
    ['lft', 'Liver Function Test (LFT)', 'LFT', ['liver'], 12, '12 hrs', 0, 1000, 599],
    ['kft', 'Kidney Function Test (KFT)', 'KFT', ['kidney'], 10, '12 hrs', 0, 1000, 599],
    ['urine', 'Urine Routine & Microscopy', 'Urine Routine', ['kidney'], 20, '8 hrs', 0, 300, 149],
    ['testo', 'Testosterone, Total', 'Testosterone', ['hormones', 'men'], 1, '24 hrs', 0, 1200, 699],
    ['cortisol', 'Cortisol, Morning', 'Cortisol', ['hormones'], 1, '24 hrs', 0, 900, 549],
    ['psa', 'PSA, Total', 'PSA', ['men'], 1, '24 hrs', 0, 1000, 599],
    ['fsh', 'FSH (Follicle Stimulating Hormone)', 'FSH', ['hormones', 'women'], 1, '24 hrs', 0, 700, 449],
    ['lh', 'LH (Luteinizing Hormone)', 'LH', ['hormones', 'women'], 1, '24 hrs', 0, 700, 449],
    ['prolactin', 'Prolactin', 'Prolactin', ['hormones', 'women'], 1, '24 hrs', 0, 800, 499],
    ['estradiol', 'Estradiol (E2)', 'Estradiol', ['hormones', 'women'], 1, '24 hrs', 0, 1000, 649],
    ['amh', 'AMH (Anti-Müllerian Hormone)', 'AMH', ['hormones', 'women'], 1, '48 hrs', 0, 2800, 1799],
    ['dheas', 'DHEA-S', 'DHEA-S', ['hormones', 'women'], 1, '24 hrs', 0, 1400, 849]
  ].map(a => ({ id: a[0], name: a[1], short: a[2], cat: a[3], params: a[4], tat: a[5], fasting: !!a[6], mrp: a[7], price: a[8] }));
  static DETAILS = {
    vitd: ['25-Hydroxy Vitamin D, Vitamin D Total, Calcidiol', 'Measures the main form of vitamin D circulating in your blood. Low levels are common and linked to fatigue, bone pain, hair fall and low immunity.', ['25-OH Vitamin D (D2 + D3)'], 'Blood'],
    b12: ['Cobalamin, Cyanocobalamin', 'Checks your vitamin B12 level, needed for healthy nerves and red blood cells. Low B12 can cause tiredness, tingling, poor memory and anaemia.', ['Vitamin B12 (Cobalamin)'], 'Blood'],
    folate: ['Folate, Vitamin B9, Serum Folic Acid', 'Measures folate, essential for making red blood cells and for a healthy pregnancy. Often tested together with B12.', ['Folic Acid (Serum)'], 'Blood'],
    calcium: ['Serum Calcium, Total Calcium', 'Measures calcium in your blood — important for bones, muscles, nerves and the heart.', ['Calcium, Total'], 'Blood'],
    iron: ['Iron Profile, Iron Panel', 'Checks how much iron you have and how well your body stores and carries it. Helps find iron-deficiency anaemia or iron overload.', ['Serum Iron', 'TIBC (Total Iron Binding Capacity)', 'UIBC', 'Transferrin Saturation'], 'Blood'],
    ferritin: ['Serum Ferritin', 'Ferritin shows your stored iron. Low ferritin is the earliest sign of iron deficiency — a common cause of hair fall and tiredness.', ['Ferritin'], 'Blood'],
    cbc: ['Complete Haemogram, Full Blood Count, CBC with ESR', 'A broad screen of your red cells, white cells and platelets. Helps detect anaemia, infection, inflammation and many other conditions.', ['Haemoglobin', 'RBC Count', 'Haematocrit (PCV)', 'MCV', 'MCH', 'MCHC', 'RDW-CV', 'RDW-SD', 'Total WBC Count', 'Neutrophils %', 'Lymphocytes %', 'Monocytes %', 'Eosinophils %', 'Basophils %', 'Absolute Neutrophil Count', 'Absolute Lymphocyte Count', 'Absolute Monocyte Count', 'Absolute Eosinophil Count', 'Absolute Basophil Count', 'Platelet Count', 'MPV', 'PDW', 'PCT', 'ESR'], 'Blood'],
    thyroid: ['Thyroid Function Test, TFT, T3 T4 TSH', 'Checks how well your thyroid gland is working. Helps detect an under-active or over-active thyroid.', ['Total T3 (Triiodothyronine)', 'Total T4 (Thyroxine)', 'TSH (Thyroid Stimulating Hormone)'], 'Blood'],
    tsh: ['Thyroid Stimulating Hormone, Ultrasensitive TSH', 'The most sensitive first test for thyroid problems, and for monitoring thyroid medication.', ['TSH (Ultrasensitive)'], 'Blood'],
    antitpo: ['Thyroid Peroxidase Antibody, TPO Antibody', "Detects antibodies that attack the thyroid. Helps diagnose autoimmune thyroid conditions such as Hashimoto's.", ['Anti-Thyroid Peroxidase (Anti-TPO)'], 'Blood'],
    hba1c: ['Glycated Haemoglobin, A1c, Glyco Hb, Diabetes Test', 'Shows your average blood sugar over the past 2–3 months. Used to diagnose diabetes and check how well it is being controlled.', ['Glycosylated Haemoglobin (HbA1c)', 'Mean Blood Glucose'], 'Blood'],
    fbs: ['Fasting Blood Sugar, FBS, Fasting Plasma Glucose', 'Measures your blood sugar after an overnight fast. A basic screen for diabetes and prediabetes.', ['Glucose, Fasting (Plasma)'], 'Blood'],
    insulin: ['Fasting Insulin, Serum Insulin', 'Measures insulin after fasting. Helps spot insulin resistance — common with PCOS, weight gain and prediabetes.', ['Insulin, Fasting'], 'Blood'],
    lipid: ['Cholesterol Test, Lipid Panel', 'Measures cholesterol and fats in your blood to assess your risk of heart disease and stroke.', ['Total Cholesterol', 'Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol', 'VLDL Cholesterol', 'Non-HDL Cholesterol', 'Total Cholesterol / HDL Ratio', 'LDL / HDL Ratio', 'HDL / LDL Ratio'], 'Blood'],
    crp: ['High-Sensitivity C-Reactive Protein, hsCRP', 'Detects low-grade inflammation in the body and helps assess heart risk.', ['hs-CRP'], 'Blood'],
    lft: ['Liver Panel, Liver Profile, LFT', 'Checks how well your liver is working and looks for liver inflammation or damage.', ['Bilirubin, Total', 'Bilirubin, Direct', 'Bilirubin, Indirect', 'SGOT (AST)', 'SGPT (ALT)', 'AST / ALT Ratio', 'Alkaline Phosphatase', 'GGT', 'Total Protein', 'Albumin', 'Globulin', 'A / G Ratio'], 'Blood'],
    kft: ['Renal Function Test, RFT, Kidney Panel', 'Checks how well your kidneys filter waste and balance salts in the blood.', ['Urea', 'Blood Urea Nitrogen (BUN)', 'Creatinine', 'BUN / Creatinine Ratio', 'Uric Acid', 'Calcium', 'Sodium', 'Potassium', 'Chloride', 'eGFR'], 'Blood'],
    urine: ['Urine R/M, Urine Analysis, Urinalysis', 'A routine check of your urine. Helps detect urinary infections, kidney problems and diabetes.', ['Colour', 'Appearance', 'Specific Gravity', 'pH', 'Protein', 'Glucose', 'Ketones', 'Bilirubin', 'Urobilinogen', 'Blood', 'Nitrite', 'Leucocyte Esterase', 'Pus Cells', 'RBCs', 'Epithelial Cells', 'Casts', 'Crystals', 'Bacteria', 'Yeast', 'Mucus'], 'Urine'],
    testo: ['Total Testosterone, Serum Testosterone', 'Measures testosterone — linked to energy, mood, muscle and libido in men, and to PCOS in women.', ['Testosterone, Total'], 'Blood'],
    cortisol: ['Serum Cortisol, Stress Hormone Test', 'Measures cortisol, your main stress hormone. Best taken in the morning.', ['Cortisol (Morning)'], 'Blood'],
    psa: ['Prostate Specific Antigen, Total PSA', 'A screening test for prostate health, usually recommended for men over 50.', ['PSA, Total'], 'Blood'],
    fsh: ['Follicle Stimulating Hormone', 'Helps assess fertility, menstrual problems and menopause.', ['FSH'], 'Blood'],
    lh: ['Luteinizing Hormone', 'Helps assess ovulation, fertility and PCOS. Often tested with FSH.', ['LH'], 'Blood'],
    prolactin: ['Serum Prolactin, PRL', 'High prolactin can cause irregular periods, infertility and breast discharge.', ['Prolactin'], 'Blood'],
    estradiol: ['E2, Oestradiol', 'Measures the main female hormone. Helps assess cycles, fertility and menopause.', ['Estradiol (E2)'], 'Blood'],
    amh: ['Anti-Müllerian Hormone, Egg Reserve Test', 'Estimates your ovarian (egg) reserve. Useful when planning pregnancy and in PCOS.', ['AMH'], 'Blood'],
    dheas: ['Dehydroepiandrosterone Sulphate', 'Checks adrenal hormone levels. Often tested for PCOS, acne and excess hair growth.', ['DHEA-S'], 'Blood']
  };
  static PROFILES = [
    { id: 'essential', name: 'Essential Wellness', tag: 'Wellness', sym: 'Wl', hue: 275, tags: ['wellness'], tagline: 'Your yearly health baseline — in one sample.', tests: ['cbc', 'lipid', 'lft', 'kft', 'fbs', 'tsh', 'urine'], price: 1299, tat: '24 hrs', ideal: ['Adults 18+', 'Annual check-up', 'No symptoms'], benefits: ['Screens blood, heart, liver, kidney & thyroid', 'Catch silent issues before they show up', 'A baseline to compare next year against'] },
    { id: 'vitamin', name: 'Vitamin Check', tag: 'Vitamins', sym: 'Vi', hue: 75, tags: ['vitamins'], tagline: 'Low energy, hair fall or body aches? Start here.', tests: ['vitd', 'b12', 'folate', 'calcium', 'iron', 'ferritin'], price: 1899, tat: '24 hrs', ideal: ['Fatigue', 'Hair fall', 'Desk jobs', 'Vegetarian diets'], benefits: ['Find deficiencies behind tiredness & aches', 'Checks iron stores, not just haemoglobin', 'Know exactly what to supplement'] },
    { id: 'thyroid', name: 'Thyroid Plus', tag: 'Thyroid', sym: 'Th', hue: 195, tags: ['thyroid'], tagline: 'Weight changes, mood swings or feeling cold?', tests: ['thyroid', 'antitpo', 'cbc', 'lipid'], price: 1499, tat: '48 hrs', ideal: ['Weight changes', 'Hair thinning', 'Family history'], benefits: ['Full T3, T4 & TSH with antibody check', 'Helps spot autoimmune thyroid early', 'Lipids included — thyroid affects cholesterol'] },
    { id: 'women', name: "Women's Hormone Profile", tag: 'Women', sym: 'Wh', hue: 345, tags: ['women'], tagline: 'Cycles, fertility & energy — understand your hormones.', tests: ['fsh', 'lh', 'prolactin', 'estradiol', 'tsh', 'amh'], price: 2999, tat: '48 hrs', ideal: ['Irregular cycles', 'Planning pregnancy', 'Age 25–45'], benefits: ['Key reproductive hormones in one draw', 'AMH gives a view of ovarian reserve', 'Best taken on day 2–5 of your cycle'] },
    { id: 'pcos', name: 'PCOS Profile', tag: 'Women', sym: 'Pc', hue: 320, tags: ['women'], tagline: 'Acne, irregular periods or weight gain? Get clarity.', tests: ['fsh', 'lh', 'prolactin', 'testo', 'insulin', 'fbs', 'tsh', 'dheas', 'lipid'], price: 2799, tat: '24 hrs', ideal: ['Irregular periods', 'Acne & hair growth', 'Weight gain'], benefits: ['Checks LH:FSH ratio & androgens', 'Insulin & glucose for metabolic risk', 'Helps your doctor assess PCOS'] },
    { id: 'men', name: "Men's Vitality", tag: 'Men', sym: 'Mh', hue: 245, tags: ['men'], tagline: 'Energy, stamina and long-term health — measured.', tests: ['testo', 'cortisol', 'tsh', 'hba1c', 'lipid', 'vitd', 'psa'], price: 2699, tat: '24 hrs', ideal: ['Low energy', 'Men 30+', 'Stress & sleep issues'], benefits: ['Testosterone & cortisol for energy and stress', 'Sugar, cholesterol & Vitamin D in one draw', 'PSA screening for men over 40'] },
    { id: 'diabetes', name: 'Diabetes Care', tag: 'Diabetes', sym: 'Gl', hue: 150, tags: ['diabetes'], tagline: 'Track sugar control and protect heart & kidneys.', tests: ['fbs', 'hba1c', 'insulin', 'lipid', 'kft', 'urine'], price: 1599, tat: '24 hrs', ideal: ['Diabetic or pre-diabetic', 'Family history', 'Every 3 months'], benefits: ['HbA1c shows your 3-month average', 'Kidney & urine checks for early damage', 'Insulin reveals resistance early'] },
    { id: 'fullbody', name: 'Full Body Advanced', tag: 'Wellness', sym: 'Fb', hue: 25, tags: ['wellness'], tagline: 'Head-to-toe checkup with vitamins & inflammation.', tests: ['cbc', 'lipid', 'lft', 'kft', 'thyroid', 'hba1c', 'fbs', 'vitd', 'b12', 'iron', 'urine', 'crp'], price: 3499, tat: '24 hrs', ideal: ['Adults 30+', 'Yearly full checkup', 'Busy schedules'], benefits: ['12 tests across 9 body systems', 'Includes Vitamin D, B12 & iron', 'Reports shared on WhatsApp'] }
  ];
  static PICON = { essential: 'shield-plus', vitamin: 'pill', thyroid: 'zap', women: 'flower-2', pcos: 'venus-and-mars', men: 'biceps-flexed', diabetes: 'syringe', fullbody: 'activity' };
  static POPULAR = ['vitd', 'thyroid', 'hba1c', 'cbc', 'b12', 'lipid', 'testo', 'amh'];
  static TYPE_TERMS = { tests: ['Vitamin D', 'thyroid', 'HbA1c', 'iron studies', 'lipid profile'], profiles: ["women's health", 'PCOS', "men's health", 'vitamin check'] };
  static SLOTS = [['6–8 AM', 6], ['8–10 AM', 8], ['10–12 PM', 10], ['12–2 PM', 12], ['4–6 PM', 16], ['6–8 PM', 18]];
  static PF = [['all', 'All'], ['wellness', 'Wellness'], ['vitamins', 'Vitamins'], ['thyroid', 'Thyroid'], ['women', 'Women'], ['men', 'Men'], ['diabetes', 'Diabetes']];
