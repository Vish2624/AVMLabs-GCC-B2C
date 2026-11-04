  state = this.init();
  reelsRef = React.createRef();

  init() {
    this.fromOldHash();
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('avmlabs_cart_v1') || '[]') || []; } catch (e) {}
    // Drop saved items that no longer exist in the catalogue so the cart badge stays accurate.
    const ok = c => c && (c.type === 'test' ? Component.TESTS : c.type === 'profile' ? Component.PROFILES : []).some(x => x.id === c.id);
    cart = Array.isArray(cart) ? cart.filter(ok) : [];
    return { page: 'home', w: window.innerWidth, h: window.innerHeight, cart, sMode: 'tests', q: '', qFocus: false, cat: 'all', tq: '', pf: 'all', hero: 0,
      reelsOpen: false, reelIdx: 0, slides: {}, mode: 'home',
      form: { name: '', phone: '', age: '', gender: '', date: '', slot: '' }, errors: {}, booked: null,
      locOpen: false, toast: '', pop: null, ...this.fromUrl() };
  }

  db() {
    if (Component._db) return Component._db;
    const T = {}; Component.TESTS.forEach(t => { T[t.id] = t; });
    const P = Component.PROFILES.map((p, i) => {
      const ts = p.tests.map(id => T[id]);
      const tats = Object.fromEntries(Object.keys(Component.REGIONS).map(code => [code, ts.map(t => (t.tats || {})[code] || '').reduce((a, v) => (this.tatHrs(v) > this.tatHrs(a) ? v : a), '')]));
      return { ...p, i, ts, tats, params: ts.reduce((a, t) => a + t.params, 0), fasting: ts.some(t => t.fasting) };
    });
    const PM = {}; P.forEach(p => { PM[p.id] = p; });
    const inProf = {}; P.forEach(p => p.tests.forEach(id => { (inProf[id] = inProf[id] || []).push(p); }));
    // R: the profiles in the reels and the home reel row (all of P are on the Profiles page), kept together by
    // category in the order the categories first appear, so swiping follows the grouped desktop reel list.
    const R = P.filter(p => p.reel), first = {};
    R.forEach(p => { if (!(p.tags[0] in first)) first[p.tags[0]] = Object.keys(first).length; });
    R.sort((a, b) => first[a.tags[0]] - first[b.tags[0]]);
    return (Component._db = { T, P, PM, inProf, R });
  }

  // Swaps the built-in tests and profiles for the ones managed in the admin (/api/tests, /api/profiles), fetched
  // together. They usually match what's built in, and then nothing re-renders; the built-in lists stay when the API
  // can't be reached.
  loadCatalog() {
    const get = url => fetch(url).then(r => (r.ok ? r.json() : null)).catch(() => null);
    // Key order differs between the built-in JSON and the database, so compare with sorted keys.
    const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(n => [n, x[n]])) : x));
    Promise.all([get('/api/tests'), get('/api/profiles')]).then(([tests, profiles]) => {
      const T = Array.isArray(tests) && tests.length ? Component.prepTests(tests) : Component.TESTS, known = new Set(T.map(t => t.id));
      const P = (Array.isArray(profiles) ? profiles : []).map(p => Component.siteProfile(p, known)).filter(p => p.tests.length);
      const newT = canon(T) !== canon(Component.TESTS), newP = P.length > 0 && canon(P) !== canon(Component.PROFILES);
      if (!newT && !newP) return;
      if (newT) Component.TESTS = T;
      if (newP) { Component.PROFILES = P; Component.PICON = Object.fromEntries(P.map(p => [p.id, p.icon])); }
      Component._db = null;
      // A link to a test or reel that only exists in the admin couldn't open before the lists arrived.
      const h = this.fromUrl(), list = Component.PROFILES, reel = this.state.reelsOpen && h.reelsOpen && h.found;
      if (reel) { this._ri = h.reelIdx; requestAnimationFrame(() => this.applyTrack(h.reelIdx, false)); }
      this.setState(s => ({ catalogVer: (s.catalogVer || 0) + 1, cart: s.cart.filter(c => (c.type === 'test' ? Component.TESTS : list).some(x => x.id === c.id)),
        ...(h.page === 'test' && s.page !== 'test' ? { page: 'test', testId: h.testId } : {}), ...(reel ? { reelIdx: h.reelIdx, reelSolo: h.reelSolo } : {}) }));
    });
  }

  opts() {
    const p = this.props || {}, rg = this.region();
    return { wa: String(p[rg.waProp] || rg.waDef).replace(/\D/g, '') };
  }

