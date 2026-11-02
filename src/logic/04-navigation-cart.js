  photo(slot) {
    const p = Component.PHOTOS[slot];
    if (!p) return { photoSrc: '', photoCredit: '', photoHref: '' };
    return { photoSrc: 'https://images.unsplash.com/photo-' + p[0] + '?auto=format&fit=crop&w=800&q=80', photoCredit: 'Photo by ' + p[1] + ' on Unsplash', photoHref: 'https://unsplash.com/@' + p[2] };
  }
  wa(msg) { return 'https://wa.me/' + this.opts().wa + '?text=' + encodeURIComponent(msg); }
  openWA(msg) { window.open(this.wa(msg), '_blank', 'noopener'); }
  go(page) { this.setState({ page, locOpen: false, qFocus: false }); window.scrollTo(0, 0); }
  openTest(id) { this.setState({ page: 'test', testId: id, locOpen: false, qFocus: false, reelsOpen: false }); window.scrollTo(0, 0); }
  flash(msg) { this.setState({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast: '' }), 2200); }

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
    }
  }
  switchTo(p, ov) { this.setCart(c => [...c.filter(x => !(x.type === 'test' && ov.includes(x.id))), { type: 'profile', id: p.id }], 'Switched to ' + p.name); }

  matches() {
    const D = this.db(), cart = this.state.cart;
    const tIds = cart.filter(c => c.type === 'test').map(c => c.id);
    const pIds = cart.filter(c => c.type === 'profile').map(c => c.id);
    if (!tIds.length) return [];
    const out = [];
    D.P.forEach(p => {
      if (pIds.includes(p.id)) return;
      const ov = p.tests.filter(id => tIds.includes(id));
      if (!ov.length) return;
      const others = p.tests.filter(id => !tIds.includes(id));
      const extra = p.price - ov.reduce((a, id) => a + D.T[id].price, 0);
      if (!others.length && extra >= 0) return;
      out.push({ p, ov, others, extra, worth: others.reduce((a, id) => a + D.T[id].mrp, 0) });
    });
    out.sort((a, b) => b.ov.length - a.ov.length || a.extra - b.extra);
    return out;
  }
  matchVM(m) {
    const D = this.db(), inr = x => this.inr(x);
    const names = m.ov.map(id => D.T[id].short);
    const list = names.length <= 2 ? names.join(' & ') : names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
    const n = m.others.length, k = m.ov.length, save = m.extra < 0, free = m.extra === 0;
    return {
      headline: save ? 'Switch & save ' + inr(-m.extra) : free ? 'Get ' + n + ' more test' + (n > 1 ? 's' : '') + ' at no extra cost' : 'Get ' + n + ' more test' + (n > 1 ? 's' : '') + ' for just ' + inr(m.extra) + ' more',
      detail: save || free ? m.p.name + ' covers your ' + list + (n ? ' — plus ' + n + ' more test' + (n > 1 ? 's' : '') + '.' : '.') : 'Your ' + list + (k > 1 ? ' are' : ' is') + ' part of ' + m.p.name + '. The extra tests are worth ' + inr(m.worth) + ' on their own.',
      pill: save ? 'Save ' + inr(-m.extra) : '+' + n + ' test' + (n > 1 ? 's' : ''),
      extras: m.others.map(id => D.T[id].short),
      switchIt: () => this.switchTo(m.p, m.ov),
      view: () => this.openReels(m.p.i)
    };
  }

  bill() {
    const D = this.db(), o = this.opts();
    let mrp = 0, price = 0, raw = 0;
    const items = [];
    this.state.cart.forEach(c => {
      const x = c.type === 'profile' ? D.PM[c.id] : D.T[c.id]; if (!x) return;
      const lp = this.loc(x.price); mrp += this.loc(x.mrp); price += lp; raw += x.price;
      items.push({ name: x.name + (c.type === 'profile' ? ' (Profile)' : ''), price: lp });
    });
    const hc = raw < o.freeAbove ? this.loc(o.fee) : 0;
    const pay = price + hc;
    return { items, mrp, price, raw, saving: mrp - price, hc, pay };
  }

