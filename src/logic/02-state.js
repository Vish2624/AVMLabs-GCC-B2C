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
      form: { name: '', phone: '', nid: '', age: '', gender: '', date: '', slot: '', address: '' }, errors: {}, booked: null,
      locOpen: false, toast: '', pop: null, ...this.fromHash() };
  }

  db() {
    if (Component._db) return Component._db;
    const T = {}; Component.TESTS.forEach(t => { T[t.id] = t; });
    const P = Component.PROFILES.map((p, i) => {
      const ts = p.tests.map(id => T[id]);
      return { ...p, i, ts, params: ts.reduce((a, t) => a + t.params, 0), mrp: ts.reduce((a, t) => a + t.mrp, 0), fasting: ts.some(t => t.fasting) };
    });
    const PM = {}; P.forEach(p => { PM[p.id] = p; });
    const inProf = {}; P.forEach(p => p.tests.forEach(id => { (inProf[id] = inProf[id] || []).push(p); }));
    return (Component._db = { T, P, PM, inProf });
  }

  // Swaps the built-in profiles for the ones managed in the admin (/api/profiles).
  // Keeps the built-in list when the API can't be reached.
  loadProfiles() {
    const sym = name => { const w = name.replace(/[^A-Za-z ]/g, '').split(/s+/).filter(Boolean); return w.length > 1 ? w[0][0].toUpperCase() + w[1][0].toLowerCase() : (w[0] || '··').slice(0, 2); };
    fetch('/api/profiles').then(r => (r.ok ? r.json() : null)).then(list => {
      if (!Array.isArray(list) || !list.length) return;
      const known = new Set(Component.TESTS.map(t => t.id));
      const profiles = list.map(p => ({ id: p.id, name: p.name, tag: p.tag, sym: sym(p.name), hue: p.hue, tags: [p.category], tagline: p.tagline,
        tests: [...new Set(p.subs.flatMap(s => s.tests))].filter(id => known.has(id)), price: p.price, subs: p.subs })).filter(p => p.tests.length);
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
    const p = this.props || {};
    const n = (v, d) => (v === undefined || v === null || v === '' || isNaN(+v)) ? d : +v;
    const rg = this.region();
    return { wa: String(p[rg.waProp] || rg.waDef).replace(/\D/g, ''), fee: n(p.homeCollectionFee, 250), freeAbove: n(p.freeHomeCollectionAbove, 0) };
  }

