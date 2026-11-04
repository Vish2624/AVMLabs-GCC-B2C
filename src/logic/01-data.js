  // Test categories from the test master. short: label for the small category circles.
  // Must match TEST_CATEGORIES in server/catalog.js.
  static CATS = [
    { id: 'routine', label: 'Liver, Kidney & Routine', short: 'Routine', sym: 'Rt', icon: 'test-tube', hue: 45 }, { id: 'diabetes', label: 'Diabetes', sym: 'Gl', icon: 'syringe', hue: 240 },
    { id: 'thyroid', label: 'Thyroid', sym: 'Th', icon: 'zap', hue: 200 }, { id: 'vitamins', label: 'Vitamins & Minerals', short: 'Vitamins', sym: 'Vi', icon: 'pill', hue: 85 },
    { id: 'heart', label: 'Heart & Lipids', short: 'Heart', sym: 'Ht', icon: 'heart-pulse', hue: 25 }, { id: 'hormones', label: 'Hormones', sym: 'Ho', icon: 'atom', hue: 300 },
    { id: 'infections', label: 'Infections & Immunity', short: 'Infections', sym: 'In', icon: 'shield-check', hue: 160 }, { id: 'tumour', label: 'Tumour Markers', short: 'Tumour', sym: 'Tm', icon: 'ribbon', hue: 330 }
  ];
  static TESTS = @json data/tests.json;
  // Two letters for a profile's badge, from its first two words ("Essential Wellness" -> "Ew").
  static symOf(name) { const w = name.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean); return w.length > 1 ? w[0][0].toUpperCase() + w[1][0].toLowerCase() : (w[0] || '··').slice(0, 2); }
  // Built-in profiles (src/data/profiles.json, from the B2C rates sheet), in the shape /api/profiles gives: the shared
  // panels and the profile's own tests become `subs`, and `tests` lists every test once. Shown until the admin's profiles
  // load. A profile's report time is the longest of its tests' (see tats in db()).
  static fromCatalog({ library, profiles }) {
    const lib = Object.fromEntries(library.map(s => [s.id, s]));
    return profiles.map(p => {
      const panels = p.subProfiles.map(id => lib[id]).filter(Boolean);
      const subs = [...panels.map(s => ({ name: s.name, tests: s.tests })), ...(p.tests.length ? [{ name: panels.length ? 'Additional tests' : 'Tests', tests: p.tests }] : [])];
      return { id: p.id, name: p.name, tag: p.tag, sym: Component.symOf(p.name), hue: p.hue, icon: p.icon, tags: [p.category], tagline: p.tagline,
        tests: [...new Set(subs.flatMap(s => s.tests))], prices: p.prices, ideal: p.ideal, benefits: p.benefits, subs };
    });
  }
  static CATALOG = @json data/profiles.json;
  static PROFILES = Component.fromCatalog(Component.CATALOG);
  static PICON = Object.fromEntries(Component.PROFILES.map(p => [p.id, p.icon]));
  static TYPE_TERMS = { tests: ['Vitamin D', 'TSH', 'HbA1c', 'CBC', 'cholesterol'], profiles: ['Essential Wellness', 'hair fall', 'thyroid', 'heart', 'vitamin'] };
  // Unsplash photos for image slots: [photo id, photographer, Unsplash username]. Unsplash requires the credit.
  static PHOTOS = {
    'profile-bg-essential-wellness': ['1512621776951-a57141f2eefd', 'Anna Pelzer', 'annapelzer'],
    'profile-bg-women-complete-wellness': ['1506126613408-eca07ce68773', 'Jared Rice', 'jareddrice'],
    'profile-bg-men-complete-wellness': ['1568602471122-7832951cc4c5', 'Christian Buehner', 'christianbuehner'],
    'profile-bg-women-hormone-plus': ['1562337404-3044c84ac061', 'Kate Kozyrka', 'kozyrka_kate'],
    'profile-bg-vitamin-profile': ['1707129785947-ddc627a8bab9', 'Madara', 'madara_p'],
    'profile-bg-thyro-5': ['1544005313-94ddf0286df2', 'Štefan Štefančík', 'cikstefan'],
    'profile-bg-diabetes-monitoring': ['1683727186226-910f31a9da45', 'Sweet Life', 'sweetlifediabetes'],
  };
  // Our Bahrain centre: assets/centres/bahrain-<file>.jpg, [file, caption].
  static CENTRE_PHOTOS = [['reception', 'Reception'], ['blood-collection', 'Blood collection unit'], ['waiting-area', 'Waiting area'], ['entrance', 'Collection centre entrance']];
  static SLOTS = [['6–8 AM', 6], ['8–10 AM', 8], ['10–12 PM', 10], ['12–2 PM', 12], ['4–6 PM', 16], ['6–8 PM', 18]];
  // Profile filters: must match CATEGORIES in server/catalog.js.
  static PF = [['all', 'All'], ['wellness', 'Wellness'], ['women', 'Women'], ['men', 'Men'], ['heart', 'Heart'], ['diabetes', 'Diabetes'], ['thyroid', 'Thyroid'], ['vitamins', 'Vitamins'], ['hair', 'Hair fall'], ['organs', 'Kidney & Liver'], ['kids', 'Kids'], ['screening', 'Screening']];
