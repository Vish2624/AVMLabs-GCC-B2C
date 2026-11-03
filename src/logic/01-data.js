  // Test categories from the test master. short: label for the small category circles.
  // Must match TEST_CATEGORIES in server/catalog.js.
  static CATS = [
    { id: 'routine', label: 'Liver, Kidney & Routine', short: 'Routine', sym: 'Rt', icon: 'test-tube', hue: 45 }, { id: 'diabetes', label: 'Diabetes', sym: 'Gl', icon: 'syringe', hue: 240 },
    { id: 'thyroid', label: 'Thyroid', sym: 'Th', icon: 'zap', hue: 200 }, { id: 'vitamins', label: 'Vitamins & Minerals', short: 'Vitamins', sym: 'Vi', icon: 'pill', hue: 85 },
    { id: 'heart', label: 'Heart & Lipids', short: 'Heart', sym: 'Ht', icon: 'heart-pulse', hue: 25 }, { id: 'hormones', label: 'Hormones', sym: 'Ho', icon: 'atom', hue: 300 },
    { id: 'infections', label: 'Infections & Immunity', short: 'Infections', sym: 'In', icon: 'shield-check', hue: 160 }, { id: 'tumour', label: 'Tumour Markers', short: 'Tumour', sym: 'Tm', icon: 'ribbon', hue: 330 }
  ];
  static TESTS = @json data/tests.json;
  static PROFILES = [
    { id: 'essential', name: 'Essential Wellness', tag: 'Wellness', sym: 'Wl', hue: 275, tags: ['wellness'], tagline: 'Your yearly health baseline — in one sample.', tests: ['cbc', 'cholesterol', 'triglycerides', 'hdl', 'ldl', 'bilirubin-total', 'bilirubin-direct', 'sgot', 'sgpt', 'alp', 'ggt', 'total-protein', 'albumin', 'creatinine', 'bun', 'uric-acid', 'electrolytes', 'fbs', 'tsh', 'urine'], prices: { AE: 141, SA: 141, BH: 14.3 }, ideal: ['Adults 18+', 'Annual check-up', 'No symptoms'], benefits: ['Screens blood, heart, liver, kidney & thyroid', 'Catch silent issues before they show up', 'A baseline to compare next year against'] },
    { id: 'vitamin', name: 'Vitamin Check', tag: 'Vitamins', sym: 'Vi', hue: 75, tags: ['vitamins'], tagline: 'Low energy, hair fall or body aches? Start here.', tests: ['vitd', 'b12', 'folate', 'calcium', 'serum-iron', 'tibc', 'ferritin'], prices: { AE: 95, SA: 95, BH: 9.9 }, ideal: ['Fatigue', 'Hair fall', 'Desk jobs', 'Vegetarian diets'], benefits: ['Find deficiencies behind tiredness & aches', 'Checks iron stores, not just haemoglobin', 'Know exactly what to supplement'] },
    { id: 'thyroid', name: 'Thyroid Plus', tag: 'Thyroid', sym: 'Th', hue: 195, tags: ['thyroid'], tagline: 'Weight changes, mood swings or feeling cold?', tests: ['t3', 't4', 'tsh', 'anti-tpo', 'cbc', 'cholesterol', 'triglycerides', 'hdl', 'ldl'], prices: { AE: 105, SA: 105, BH: 10.7 }, ideal: ['Weight changes', 'Hair thinning', 'Family history'], benefits: ['Full T3, T4 & TSH with antibody check', 'Helps spot autoimmune thyroid early', 'Lipids included — thyroid affects cholesterol'] },
    { id: 'women', name: "Women's Hormone Profile", tag: 'Women', sym: 'Wh', hue: 345, tags: ['women'], tagline: 'Cycles, fertility & energy — understand your hormones.', tests: ['fsh', 'lh', 'prolactin', 'estradiol', 'tsh', 'amh'], prices: { AE: 181, SA: 181, BH: 18.8 }, ideal: ['Irregular cycles', 'Planning pregnancy', 'Age 25–45'], benefits: ['Key reproductive hormones in one draw', 'AMH gives a view of ovarian reserve', 'Best taken on day 2–5 of your cycle'] },
    { id: 'pcos', name: 'PCOS Profile', tag: 'Women', sym: 'Pc', hue: 320, tags: ['women'], tagline: 'Acne, irregular periods or weight gain? Get clarity.', tests: ['fsh', 'lh', 'prolactin', 'testo', 'insulin', 'fbs', 'tsh', 'dheas', 'cholesterol', 'triglycerides', 'hdl', 'ldl'], prices: { AE: 150, SA: 150, BH: 15.7 }, ideal: ['Irregular periods', 'Acne & hair growth', 'Weight gain'], benefits: ['Checks LH:FSH ratio & androgens', 'Insulin & glucose for metabolic risk', 'Helps your doctor assess PCOS'] },
    { id: 'men', name: "Men's Vitality", tag: 'Men', sym: 'Mh', hue: 245, tags: ['men'], tagline: 'Energy, stamina and long-term health — measured.', tests: ['testo', 'cortisol', 'tsh', 'hba1c', 'cholesterol', 'triglycerides', 'hdl', 'ldl', 'vitd', 'psa'], prices: { AE: 155, SA: 155, BH: 16 }, ideal: ['Low energy', 'Men 30+', 'Stress & sleep issues'], benefits: ['Testosterone & cortisol for energy and stress', 'Sugar, cholesterol & Vitamin D in one draw', 'PSA screening for men over 40'] },
    { id: 'diabetes', name: 'Diabetes Care', tag: 'Diabetes', sym: 'Gl', hue: 150, tags: ['diabetes'], tagline: 'Track sugar control and protect heart & kidneys.', tests: ['fbs', 'hba1c', 'insulin', 'cholesterol', 'triglycerides', 'hdl', 'ldl', 'creatinine', 'bun', 'uric-acid', 'electrolytes', 'urine'], prices: { AE: 125, SA: 125, BH: 12.9 }, ideal: ['Diabetic or pre-diabetic', 'Family history', 'Every 3 months'], benefits: ['HbA1c shows your 3-month average', 'Kidney & urine checks for early damage', 'Insulin reveals resistance early'] },
    { id: 'fullbody', name: 'Full Body Advanced', tag: 'Wellness', sym: 'Fb', hue: 25, tags: ['wellness'], tagline: 'Head-to-toe checkup with vitamins & inflammation.', tests: ['cbc', 'cholesterol', 'triglycerides', 'hdl', 'ldl', 'bilirubin-total', 'bilirubin-direct', 'sgot', 'sgpt', 'alp', 'ggt', 'total-protein', 'albumin', 'creatinine', 'bun', 'uric-acid', 'electrolytes', 't3', 't4', 'tsh', 'hba1c', 'fbs', 'vitd', 'b12', 'serum-iron', 'tibc', 'urine', 'hscrp'], prices: { AE: 266, SA: 266, BH: 27.3 }, ideal: ['Adults 30+', 'Yearly full checkup', 'Busy schedules'], benefits: ['Covers 9 body systems in one visit', 'Includes Vitamin D, B12 & iron', 'Reports shared on WhatsApp'] }
  ];
  static PICON = { essential: 'shield-plus', vitamin: 'pill', thyroid: 'zap', women: 'flower-2', pcos: 'flower', men: 'biceps-flexed', diabetes: 'syringe', fullbody: 'activity' };
  static TYPE_TERMS = { tests: ['Vitamin D', 'TSH', 'HbA1c', 'CBC', 'cholesterol'], profiles: ["women's health", 'PCOS', "men's health", 'vitamin check'] };
  // Unsplash photos for image slots: [photo id, photographer, Unsplash username]. Unsplash requires the credit.
  static PHOTOS = {
    'profile-bg-vitamin': ['1707129785947-ddc627a8bab9', 'Madara', 'madara_p'],
    'profile-bg-thyroid': ['1544005313-94ddf0286df2', 'Štefan Štefančík', 'cikstefan'],
    'profile-bg-women': ['1562337404-3044c84ac061', 'Kate Kozyrka', 'kozyrka_kate'],
    'profile-bg-pcos': ['1506126613408-eca07ce68773', 'Jared Rice', 'jareddrice'],
    'profile-bg-men': ['1568602471122-7832951cc4c5', 'Christian Buehner', 'christianbuehner'],
    'profile-bg-diabetes': ['1683727186226-910f31a9da45', 'Sweet Life', 'sweetlifediabetes'],
    'profile-bg-fullbody': ['1512621776951-a57141f2eefd', 'Anna Pelzer', 'annapelzer'],
  };
  // Our Bahrain centre: assets/centres/bahrain-<file>.jpg, [file, caption].
  static CENTRE_PHOTOS = [['reception', 'Reception'], ['blood-collection', 'Blood collection unit'], ['waiting-area', 'Waiting area'], ['entrance', 'Collection centre entrance']];
  static SLOTS = [['6–8 AM', 6], ['8–10 AM', 8], ['10–12 PM', 10], ['12–2 PM', 12], ['4–6 PM', 16], ['6–8 PM', 18]];
  static PF = [['all', 'All'], ['wellness', 'Wellness'], ['vitamins', 'Vitamins'], ['thyroid', 'Thyroid'], ['women', 'Women'], ['men', 'Men'], ['diabetes', 'Diabetes']];
