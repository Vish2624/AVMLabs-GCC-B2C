  // Test categories from the test master. short: label for the small category circles.
  // Must match TEST_CATEGORIES in server/catalog.js.
  static CATS = [
    { id: 'routine', label: 'Liver, Kidney & Routine', short: 'Routine', sym: 'Rt', icon: 'test-tube', hue: 45 }, { id: 'diabetes', label: 'Diabetes', sym: 'Gl', icon: 'syringe', hue: 240 },
    { id: 'thyroid', label: 'Thyroid', sym: 'Th', icon: 'zap', hue: 200 }, { id: 'vitamins', label: 'Vitamins & Minerals', short: 'Vitamins', sym: 'Vi', icon: 'pill', hue: 85 },
    { id: 'heart', label: 'Heart & Lipids', short: 'Heart', sym: 'Ht', icon: 'heart-pulse', hue: 25 }, { id: 'hormones', label: 'Hormones', sym: 'Ho', icon: 'atom', hue: 300 },
    { id: 'infections', label: 'Infections & Immunity', short: 'Infections', sym: 'In', icon: 'shield-check', hue: 160 }, { id: 'tumour', label: 'Tumour Markers', short: 'Tumour', sym: 'Tm', icon: 'ribbon', hue: 330 }
  ];
  // Tests as the site uses them, from the built-in list or /api/tests: each with its parameter count (measured +
  // calculated, at least 1) and a category ('routine' if none). The built-in list gets the same, so the first paint
  // already has every count instead of NaN until the API answers.
  static prepTests(list) { return list.map(t => ({ ...t, cat: t.cat && t.cat.length ? t.cat : ['routine'], params: (t.parameters || []).length + (t.calculated || []).length || 1 })); }
  static TEST_DATA = @json data/tests.json;
  static TESTS = Component.prepTests(Component.TEST_DATA);
  // Two letters for a profile's badge, from its first two words ("Essential Wellness" -> "Ew").
  static symOf(name) { const w = name.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean); return w.length > 1 ? w[0][0].toUpperCase() + w[1][0].toLowerCase() : (w[0] || '··').slice(0, 2); }
  // A profile as the site uses it, from /api/profiles or the built-in list: `subs` are the groups for "What's included"
  // (tests not in `known` dropped), `tests` lists every test once. Its report time is the longest of its tests' (tats in db()).
  static siteProfile(p, known) {
    const subs = p.subs.map(s => ({ name: s.name, tests: known ? s.tests.filter(id => known.has(id)) : s.tests })).filter(s => s.tests.length);
    return { id: p.id, name: p.name, tag: p.tag, sym: Component.symOf(p.name), hue: p.hue, icon: p.icon || 'layers', tags: [p.category], tagline: p.tagline,
      tests: [...new Set(subs.flatMap(s => s.tests))], prices: p.prices || {}, ideal: p.ideal || [], benefits: p.benefits || [], subs, reel: p.inReels !== false };
  }
  // The built-in profiles (src/data/profiles.json, from the B2C rates sheet): shared panels, then the profile's own tests.
  static fromCatalog({ library, profiles }) {
    const lib = Object.fromEntries(library.map(s => [s.id, s]));
    return profiles.map(p => {
      const panels = p.subProfiles.map(id => lib[id]).filter(Boolean);
      return Component.siteProfile({ ...p, subs: [...panels, ...(p.tests.length ? [{ name: panels.length ? 'Additional tests' : 'Tests', tests: p.tests }] : [])] });
    });
  }
  static PROFILE_DATA = @json data/profiles.json;
  static PROFILES = Component.fromCatalog(Component.PROFILE_DATA);
  static PICON = Object.fromEntries(Component.PROFILES.map(p => [p.id, p.icon]));
  static TYPE_TERMS = { tests: ['Vitamin D', 'TSH', 'HbA1c', 'CBC', 'cholesterol'], profiles: ['Essential Wellness', 'hair fall', 'thyroid', 'heart', 'vitamin'] };
  // Profile photos for image slots: our own photos as a path (assets/profiles/, square, subject inside the safe
  // zone), Unsplash ones as [photo id, photographer, Unsplash username] since Unsplash requires the credit.
  static PHOTOS = {
    'profile-bg-thyro-5': './assets/profiles/thyroid.jpg',
    'profile-bg-free-thyroid': './assets/profiles/thyroid.jpg',
    'profile-bg-total-thyroid': './assets/profiles/thyroid.jpg',
    'profile-bg-essential-wellness': ['1512621776951-a57141f2eefd', 'Anna Pelzer', 'annapelzer'],
    'profile-bg-women-complete-wellness': ['1506126613408-eca07ce68773', 'Jared Rice', 'jareddrice'],
    'profile-bg-men-complete-wellness': ['1568602471122-7832951cc4c5', 'Christian Buehner', 'christianbuehner'],
    'profile-bg-women-hormone-plus': ['1562337404-3044c84ac061', 'Kate Kozyrka', 'kozyrka_kate'],
    'profile-bg-vitamin-profile': ['1707129785947-ddc627a8bab9', 'Madara', 'madara_p'],
    'profile-bg-diabetes-monitoring': ['1683727186226-910f31a9da45', 'Sweet Life', 'sweetlifediabetes'],
  };
  // Our Bahrain centre: assets/centres/bahrain-<file>.jpg, [file, caption].
  static CENTRE_PHOTOS = [['reception', 'Reception'], ['blood-collection', 'Blood collection unit'], ['waiting-area', 'Waiting area'], ['entrance', 'Collection centre entrance']];
  static SLOTS = [['6–8 AM', 6], ['8–10 AM', 8], ['10–12 PM', 10], ['12–2 PM', 12], ['4–6 PM', 16], ['6–8 PM', 18]];
  // Profile filters: must match CATEGORIES in server/catalog.js.
  static PF = [['all', 'All'], ['wellness', 'Wellness'], ['women', 'Women'], ['men', 'Men'], ['heart', 'Heart'], ['diabetes', 'Diabetes'], ['thyroid', 'Thyroid'], ['vitamins', 'Vitamins'], ['hair', 'Hair fall'], ['organs', 'Kidney & Liver'], ['kids', 'Kids'], ['screening', 'Screening']];
