  state = this.init();
  reelsRef = React.createRef();

  init() {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('avmlabs_cart_v1') || '[]') || []; } catch (e) {}
    // Drop saved items that no longer exist in the catalogue so the cart badge stays accurate.
    const ok = c => c && (c.type === 'test' ? Component.TESTS : c.type === 'profile' ? Component.PROFILES : []).some(x => x.id === c.id);
    cart = Array.isArray(cart) ? cart.filter(ok) : [];
    return { page: 'home', w: window.innerWidth, h: window.innerHeight, cart, sMode: 'tests', q: '', qFocus: false, cat: 'all', tq: '', pf: 'all', hero: 0,
      reelsOpen: false, reelIdx: 0, slides: {}, hint: false, mode: 'home',
      form: { name: '', phone: '', age: '', gender: '', date: '', slot: '' }, errors: {}, booked: null,
      locOpen: false, toast: '', pop: null, ...this.fromHash() };
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
    return (Component._db = { T, P, PM, inProf });
  }

  // Swaps the built-in profiles for the ones managed in the admin (/api/profiles).
  // Keeps the built-in list when the API can't be reached.
  // Swaps the built-in tests for the ones managed in the admin (/api/tests), then loads profiles,
  // which may use new tests. Keeps the built-in tests when the API can't be reached.
  loadCatalog() {
    fetch('/api/tests').then(r => (r.ok ? r.json() : null)).then(list => {
      if (Array.isArray(list) && list.length) {
        Component.TESTS = list.map(t => ({ ...t, cat: t.cat && t.cat.length ? t.cat : ['routine'], params: (t.parameters || []).length + (t.calculated || []).length || 1 }));
        Component._db = null;
        // A link to a test that only exists in the admin (#test/<new id>) couldn't open before the list arrived.
        const h = this.fromHash();
        this.setState(s => ({ catalogVer: (s.catalogVer || 0) + 1, ...(h.page === 'test' && s.page !== 'test' ? { page: 'test', testId: h.testId } : {}) }));
      }
    }).catch(() => {}).then(() => this.loadProfiles());
  }

  loadProfiles() {
    const sym = name => { const w = name.replace(/[^A-Za-z ]/g, '').split(/s+/).filter(Boolean); return w.length > 1 ? w[0][0].toUpperCase() + w[1][0].toLowerCase() : (w[0] || '··').slice(0, 2); };
    fetch('/api/profiles').then(r => (r.ok ? r.json() : null)).then(list => {
      if (!Array.isArray(list) || !list.length) return;
      const known = new Set(Component.TESTS.map(t => t.id));
      // The admin doesn't store the "ideal for"/benefit lists: reuse the built-in profile's.
      // Report times come from the tests (see tats in db()).
      const builtIn = Object.fromEntries(Component.PROFILES.map(p => [p.id, p]));
      const profiles = list.map(p => {
        const tests = [...new Set(p.subs.flatMap(s => s.tests))].filter(id => known.has(id)), b = builtIn[p.id] || {};
        return { id: p.id, name: p.name, tag: p.tag, sym: sym(p.name), hue: p.hue, tags: [p.category], tagline: p.tagline, tests, prices: p.prices || {}, subs: p.subs,
          ideal: b.ideal || [], benefits: b.benefits || [] };
      }).filter(p => p.tests.length);
      if (!profiles.length) return;
      Component.PROFILES = profiles;
      Component.PICON = { ...Component.PICON, ...Object.fromEntries(list.map(p => [p.id, p.icon])) };
      Component._db = null;
      const ri = this._wantReel ? profiles.findIndex(p => p.id === this._wantReel) : -1;
      this._wantReel = null;
      if (ri >= 0 && this.state.reelsOpen) { this._ri = ri; requestAnimationFrame(() => this.applyTrack(ri, false)); }
      this.setState(s => ({ profilesVer: (s.profilesVer || 0) + 1, cart: s.cart.filter(c => c.type !== 'profile' || profiles.some(p => p.id === c.id)), ...(ri >= 0 && s.reelsOpen ? { reelIdx: ri } : {}) }));
    }).catch(() => {});
  }

  opts() {
    const p = this.props || {}, rg = this.region();
    return { wa: String(p[rg.waProp] || rg.waDef).replace(/\D/g, '') };
  }

