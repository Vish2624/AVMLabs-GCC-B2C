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
      locOpen: false, pin: '', pinInput: '', pinMsg: '', pinOk: true, toast: '' };
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

  opts() {
    const p = this.props || {};
    const n = (v, d) => (v === undefined || v === null || v === '' || isNaN(+v)) ? d : +v;
    const rg = this.region();
    return { wa: String(p[rg.waProp] || rg.waDef).replace(/\D/g, ''), pct: 0, fee: n(p.homeCollectionFee, 250), freeAbove: n(p.freeHomeCollectionAbove, 0) };
  }

