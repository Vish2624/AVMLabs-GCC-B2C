  photo(slot) {
    const p = Component.PHOTOS[slot];
    if (!p) return { photoSrc: '', photoCredit: '', photoHref: '' };
    if (typeof p === 'string') return { photoSrc: p, photoCredit: '', photoHref: '' };
    return { photoSrc: 'https://images.unsplash.com/photo-' + p[0] + '?auto=format&fit=crop&w=800&q=80', photoCredit: 'Photo by ' + p[1] + ' on Unsplash', photoHref: 'https://unsplash.com/@' + p[2] };
  }
  // A WhatsApp chat link with the message filled in, to the visitor's centre or the number given.
  wa(msg, num) { return 'https://wa.me/' + (num || this.opts().wa) + '?text=' + encodeURIComponent(msg); }
  // Opens WhatsApp with the message filled in. If the browser blocks the new tab (some phones do), go there directly.
  // No 'noopener' feature: with it window.open() always returns null, which looked like a block and also sent this tab away.
  openWA(msg, isUrl, num) { const url = isUrl ? msg : this.wa(msg, num), w = window.open(url, '_blank'); if (w) { try { w.opener = null; } catch (e) {} } else window.location.href = url; }
  go(page) { this.setState({ page, locOpen: false, qFocus: false }); window.scrollTo(0, 0); this.setPath(page === 'home' ? '/' : '/' + page); }
  openTest(id) { this.setState({ page: 'test', testId: id, locOpen: false, qFocus: false, reelsOpen: false }); window.scrollTo(0, 0); this.setPath('/tests/' + encodeURIComponent(id)); }
  // The current page lives in the URL path (/tests, /tests/vitd, /profiles, /cart, /about) so a refresh reopens it
  // and search engines see each page. An open reel is /profiles/<profile id>; the page under it is kept in history.state.base.
  // vercel.json and scripts/dev.js serve index.html on these paths.
  setPath(p, base) { if (location.pathname !== p) history.pushState(base ? { base } : null, '', p); }
  replacePath(p, base) { history.replaceState(base ? { base } : null, '', p); }
  pagePath() { const s = this.state; return s.page === 'home' ? '/' : s.page === 'test' ? '/tests/' + encodeURIComponent(s.testId) : '/' + s.page; }
  reelPath(i) { const p = this.reelList()[i]; return p ? '/profiles/' + encodeURIComponent(p.id) : this.pagePath(); }
  segs(path) { let s = path; try { s = decodeURIComponent(path); } catch (e) {} return s.replace(/^\/+|\/+$/g, '').split('/'); }
  // A test id that isn't known yet (admin tests load after start-up) shows the tests list; loadCatalog() opens it once they arrive.
  pageAt(path) {
    const [p, id] = this.segs(path);
    return p === 'tests' && id && Component.TESTS.some(t => t.id === id) ? { page: 'test', testId: id } : ['tests', 'profiles', 'cart', 'about'].includes(p) ? { page: p } : { page: 'home' };
  }
  fromUrl() {
    const [p, reel] = this.segs(location.pathname);
    if (p !== 'profiles' || !reel) return { ...this.pageAt(location.pathname), reelsOpen: false };
    // A profile not in the reels opens on its own. Admin profiles load after start-up; loadCatalog() re-finds the id.
    const all = Component.PROFILES, prof = all.find(x => x.id === reel), solo = prof && !prof.reel ? prof.id : null;
    return { ...this.pageAt((history.state && history.state.base) || '/profiles'), reelsOpen: true, found: !!prof, reelSolo: solo,
      reelIdx: prof && !solo ? Math.max(0, all.filter(x => x.reel).indexOf(prof)) : 0, slides: {} };
  }
  // Older links kept the page in the hash (#tests, #test/vitd, #profiles&reel=thyroid): move them to their path.
  fromOldHash() {
    let raw = location.hash.slice(1); try { raw = decodeURIComponent(raw); } catch (e) {}
    if (!raw || !/^(tests|profiles|cart|about|test\/[^&/]+)?(&?reel=[^&]*)?$/.test(raw)) return;
    const reel = (raw.match(/(?:^|&)reel=([^&]*)/) || [])[1], [p, id] = raw.replace(/&?reel=[^&]*/, '').split('/');
    const base = p === 'test' ? '/tests/' + encodeURIComponent(id) : p ? '/' + p : '/';
    history.replaceState(reel ? { base } : null, '', (reel ? '/profiles/' + encodeURIComponent(reel) : base) + location.search);
  }
  flash(msg) { this.setState({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast: '' }), 2200); }
  // Marks an item as just added so its button plays the add animation once.
  pop(id) { this.setState({ pop: id }); clearTimeout(this._pt); this._pt = setTimeout(() => this.setState({ pop: null }), 900); }

  setCart(fn, msg) {
    const cart = fn(this.state.cart);
    try { localStorage.setItem('avmlabs_cart_v1', JSON.stringify(cart)); } catch (e) {}
    this.setState({ cart });
    if (msg) this.flash(msg);
  }
  has(type, id) { return this.state.cart.some(c => c.type === type && c.id === id); }
  toggle(type, id, name) {
    if (this.has(type, id)) { this.setCart(c => c.filter(x => !(x.type === type && x.id === id)), 'Removed ' + name); return; }
    const D = this.db();
    if (type === 'test') {
      const inP = this.state.cart.filter(c => c.type === 'profile').map(c => D.PM[c.id]).find(p => p && p.tests.includes(id));
      if (inP) { this.flash(name + ' is already in ' + inP.name); return; }
      this.setCart(c => [...c, { type, id }], 'Added ' + name);
    } else {
      const p = D.PM[id], dup = p ? this.state.cart.filter(c => c.type === 'test' && p.tests.includes(c.id)).length : 0;
      this.setCart(c => [...c.filter(x => !(x.type === 'test' && p && p.tests.includes(x.id))), { type, id }], dup ? 'Added ' + name + ' · removed ' + dup + ' duplicate test' + (dup > 1 ? 's' : '') : 'Added ' + name);
      this.pop(id);
    }
  }
  switchTo(p, ov) { this.setCart(c => [...c.filter(x => !(x.type === 'test' && ov.includes(x.id))), { type: 'profile', id: p.id }], 'Switched to ' + p.name); }

  matches() {
    const D = this.db(), cart = this.state.cart;
    const tIds = cart.filter(c => c.type === 'test').map(c => c.id);
    const pIds = cart.filter(c => c.type === 'profile').map(c => c.id);
    if (!tIds.length) return [];
    const out = [], total = this.bill().price;
    D.P.forEach(p => {
      if (pIds.includes(p.id)) return;
      const ov = p.tests.filter(id => tIds.includes(id));
      if (!ov.length) return;
      const others = p.tests.filter(id => !tIds.includes(id));
      // Local prices; rounded so BD decimals compare exactly. The difference is in what the patient actually pays,
      // so minimum billing is counted on both sides.
      const r3 = v => Math.round(v * 1000) / 1000;
      const extra = r3(this.billed(total - this.sumPr(ov.map(id => D.T[id])) + this.pr(p)) - this.billed(total));
      if (!others.length && extra >= 0) return;
      out.push({ p, ov, others, extra, worth: r3(this.sumPr(others.map(id => D.T[id]))) });
    });
    out.sort((a, b) => b.ov.length - a.ov.length || a.extra - b.extra);
    return out;
  }
  matchVM(m) {
    const D = this.db(), inr = x => this.money(x); // m.extra and m.worth are already local amounts
    const names = m.ov.map(id => D.T[id].short);
    const list = names.length <= 2 ? names.join(' & ') : names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
    const n = m.others.length, k = m.ov.length, save = m.extra < 0, free = m.extra === 0;
    return {
      headline: save ? 'Switch & save ' + inr(-m.extra) : free ? 'Get ' + n + ' more test' + (n > 1 ? 's' : '') + ' at no extra cost' : 'Get ' + n + ' more test' + (n > 1 ? 's' : '') + ' for just ' + inr(m.extra) + ' more',
      detail: save || free ? m.p.name + ' covers your ' + list + (n ? ' — plus ' + n + ' more test' + (n > 1 ? 's' : '') + '.' : '.') : 'Your ' + list + (k > 1 ? ' are' : ' is') + ' part of ' + m.p.name + '. The extra tests are worth ' + inr(m.worth) + ' on their own.',
      pill: save ? 'Save ' + inr(-m.extra) : '+' + n + ' test' + (n > 1 ? 's' : ''),
      extras: m.others.map(id => D.T[id].short),
      switchIt: () => this.switchTo(m.p, m.ov),
      view: () => this.openReels(m.p.id)
    };
  }

  // Offer prices in the visitor's country. top is what minimum billing adds to reach the minimum. Home collection is free
  // from the country's limit (hcFree); hcLeft is how much more the items need to reach it.
  bill() {
    const D = this.db();
    let price = 0;
    const items = [];
    this.state.cart.forEach(c => {
      const x = c.type === 'profile' ? D.PM[c.id] : D.T[c.id]; if (!x) return;
      const lp = this.pr(x); price += lp;
      items.push({ name: x.name + (c.type === 'profile' ? ' (Profile)' : ''), price: lp });
    });
    price = Math.round(price * 1000) / 1000;
    const pay = this.billed(price);
    const limit = this.region().hcFree, hcFree = price >= limit;
    return { items, price, hcFree, hcLeft: hcFree ? 0 : Math.round((limit - price) * 1000) / 1000, top: Math.round((pay - price) * 1000) / 1000, pay };
  }

