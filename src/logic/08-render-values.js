  renderVals() {
    // Fixed elements already sit above the browser toolbar; only clear the home-indicator safe area.
    const barPad = 'env(safe-area-inset-bottom, 0px)';
    const reelPadB = 'calc(16px + ' + barPad + ')';
    const s = this.state, D = this.db(), o = this.opts(), C = Component, RG = this.region();
    const gs = s.geo || 'asking', served = Object.values(C.REGIONS).map(r => r.name).join(' and ');
    const GT = {
      asking: ['map-pin', 'Allow location', 'To show prices for your area.', '', 'Allow'],
      locating: ['locate-fixed', 'Finding you…', 'Tap Allow if your browser asks.', '', 'Locating…'],
      denied: ['map-pin-off', 'Location is off', 'Turn it on in browser settings, then try again.', '', 'Try again'],
      error: ['map-pin-off', "Couldn't find you", 'Check GPS and internet.', '', 'Try again'],
      unsupported: ['map-pin-off', 'Location not supported', 'Open the site in Chrome or Safari.', '', 'Try again'],
      outside: ['globe', 'Not available in ' + (s.geoCountry || 'your country'), 'We serve ' + served + '.', '', 'Check again']
    }[gs] || [];
    const gateVM = { showGate: this.gateOn() && !(s.region && C.REGIONS[s.region.code]), gateIcon: GT[0], gateTitle: GT[1], gateText: GT[2], gateBtn: GT[4], gateBusy: gs === 'locating', gateCanRetry: gs !== 'locating',
      gateMain: !s.pickCountry, gatePick: !!s.pickCountry, openPick: () => this.setState({ pickCountry: true }), closePick: () => this.setState({ pickCountry: false }),
      countryOpts: ['BH', 'SA', 'AE'].map(c => ({ name: C.REGIONS[c].name, code: c === 'SA' ? 'KSA' : c, go: () => this.pickRegion(c) })) };
    const inr = x => this.inr(x);
    const off = (a, b) => { const la = this.loc(a), lb = this.loc(b); return Math.max(0, Math.round((1 - lb / la) * 100)) + '% off'; };
    const isDesktop = s.w >= 1024, isMobile = !isDesktop, isWide = s.w >= 1080;
    const pg = s.page, pgN = pg === 'test' ? 'tests' : pg;
    const cartCount = s.cart.length, hasCart = cartCount > 0;
    const go = p => () => this.go(p);
    const has = (t, id) => s.cart.some(c => c.type === t && c.id === id);
    const reelBg = h => `radial-gradient(70% 55% at 100% 0%, oklch(0.62 0.16 ${h} / 0.42), transparent 70%), radial-gradient(80% 60% at 0% 100%, oklch(0.42 0.17 275 / 0.55), transparent 70%), linear-gradient(160deg, #1D1852 0%, #141039 55%, #0E0B2B 100%)`;

    const testVM = t => {
      const inC = has('test', t.id);
      const pc = C.CATS.find(c => c.id === t.cat[0]) || C.CATS[0];
      return { name: t.name, catLabel: pc.label, icon: pc.icon, soft: `oklch(0.95 0.035 ${pc.hue})`, ring: `oklch(0.88 0.06 ${pc.hue})`, ink: `oklch(0.5 0.15 ${pc.hue})`, tatH: t.tat.replace('hrs', 'hours').replace('hr', 'hour'), paramsCap: t.params + (t.params > 1 ? ' Parameters' : ' Parameter'), offCap: off(t.mrp, t.price).replace('off', 'Off'), cardBg: 'radial-gradient(75% 70% at 100% 0%, #F0EDFE 0%, rgba(240,237,254,0) 65%), radial-gradient(55% 50% at 0% 100%, rgba(255,236,240,0.55) 0%, rgba(255,236,240,0) 70%), #FFFFFF', tat: t.tat, fasting: t.fasting,
        open: () => this.openTest(t.id),
        mrpF: inr(t.mrp), off: off(t.mrp, t.price), priceF: inr(t.price), inCart: inC, notInCart: !inC, toggle: e => { e && e.stopPropagation(); this.toggle('test', t.id, t.short); } };
    };
    let td = null;
    if (pg === 'test' && s.testId && D.T[s.testId]) {
      const t = D.T[s.testId], vm = testVM(t), dt = C.DETAILS[t.id] || ['', '', [t.name], 'Blood'];
      const ps = D.inProf[t.id] || [];
      td = { ...vm, aka: dt[0], hasAka: !!dt[0], about: dt[1], params: dt[2].map((n, k) => ({ n: k + 1, name: n })), paramsTitle: t.params + (t.params > 1 ? ' parameters' : ' parameter'),
        sample: dt[3], sampleIcon: dt[3] === 'Urine' ? 'flask-conical' : 'droplet', fastTitle: t.fasting ? 'Fasting required' : 'No fasting required', fastSub: t.fasting ? '10–12 hrs overnight, water is fine' : 'Eat and drink as usual',
        reportT: 'Report in ' + t.tat, book: () => this.openWA("Hi AVM Labs! I'd like to book the " + t.name + ' test.'),
        profs: ps.map(p => ({ name: p.name, meta: p.tests.length + ' tests · ' + inr(p.price), sym: p.sym, icon: C.PICON[p.id] || 'layers', soft: `oklch(0.94 0.045 ${p.hue})`, ink: `oklch(0.48 0.16 ${p.hue})`, dot: `oklch(0.55 0.17 ${p.hue})`, open: () => this.openReels(p.i) })), hasProfs: ps.length > 0 };
    }
    const book = p => () => this.openWA("Hi AVM Labs! I'd like to book the " + p.name + ' profile.');

    const nav = [['Home', 'home'], ['Tests', 'tests'], ['Profiles', 'profiles'], ['About us', 'about']].map(([label, p]) => ({ label, go: go(p), bg: pgN === p ? '#EFEDFB' : 'transparent', fg: pgN === p ? '#3B2C9E' : '#16133A' }));
    const segOn = { bg: '#fff', fg: '#16133A', sh: '0 2px 8px -2px rgba(22,19,58,0.2)' }, segOff = { bg: 'transparent', fg: '#5D5A7A', sh: 'none' };

    const q = s.q.trim().toLowerCase();
    let results = [], resultsLabel = '';
    if (s.sMode === 'tests') {
      const list = q ? C.TESTS.filter(t => (t.name + ' ' + t.short + ' ' + t.cat.join(' ')).toLowerCase().includes(q)) : C.POPULAR.map(id => D.T[id]);
      resultsLabel = q ? 'Tests' : 'Most booked';
      results = list.slice(0, 6).map(t => { const inC = has('test', t.id); return { name: t.name, meta: t.params + ' parameter' + (t.params > 1 ? 's' : '') + ' · Reports in ' + t.tat, priceF: inr(t.price), open: () => { this.setState({ tq: t.short, cat: 'all' }); this.go('tests'); }, action: () => this.toggle('test', t.id, t.short), alabel: inC ? 'Added' : 'Add', abg: inC ? '#3B2C9E' : '#fff', afg: inC ? '#fff' : '#3B2C9E' }; });
    } else {
      const list = q ? D.P.filter(p => (p.name + ' ' + p.tag + ' ' + p.tagline).toLowerCase().includes(q)) : D.P;
      resultsLabel = q ? 'Profiles' : 'Popular profiles';
      results = list.slice(0, 6).map(p => ({ name: p.name, meta: p.tests.length + ' tests · ' + p.params + ' parameters', priceF: inr(p.price), open: () => this.openReels(p.i), action: () => this.openReels(p.i), alabel: 'View', abg: '#fff', afg: '#3B2C9E' }));
    }

    const cats = C.CATS.map(c => ({ ...c, img: './assets/icons3d/' + c.id + '.png', soft: `oklch(0.95 0.035 ${c.hue})`, ink: `oklch(0.5 0.15 ${c.hue})`, grad: `linear-gradient(150deg, oklch(0.97 0.03 ${c.hue}) 0%, oklch(0.91 0.06 ${c.hue}) 100%)`, ring: `oklch(0.85 0.07 ${c.hue})`, count: C.TESTS.filter(t => t.cat.includes(c.id)).length, go: () => { this.setState({ cat: c.id, tq: '' }); this.go('tests'); } }));
    const tq = s.tq.trim().toLowerCase();
    const tList = C.TESTS.filter(t => (s.cat === 'all' || t.cat.includes(s.cat)) && (!tq || (t.name + ' ' + t.short).toLowerCase().includes(tq)));
    const testCats = [{ id: 'all', label: 'All tests', sym: 'All', icon: 'layout-grid', soft: '#EFEDFB', ink: '#3B2C9E', count: C.TESTS.length }, ...cats].map(c => {
      const a = s.cat === c.id;
      return { sym: c.sym, icon: c.icon, label: c.label, count: c.count, go: () => this.setState({ cat: c.id }), bg: a ? '#16133A' : '#fff', fg: a ? '#fff' : '#16133A', bd: a ? '#16133A' : '#E7E6F0', symBg: a ? 'rgba(255,255,255,0.16)' : c.soft, symFg: a ? '#fff' : c.ink };
    });

    const b = this.bill();
    const ms = this.matches().map(m => this.matchVM(m));
    const cartProfiles = s.cart.filter(c => c.type === 'profile').map(c => D.PM[c.id]).filter(Boolean);
    const cartLines = s.cart.map(c => {
      if (c.type === 'profile') { const p = D.PM[c.id]; if (!p) return null; return { name: p.name, sub: 'Profile · ' + p.tests.length + ' tests · ' + p.params + ' parameters', icon: 'layers', iconBg: '#EFEDFB', iconFg: '#3B2C9E', priceF: inr(p.price), mrpF: inr(p.mrp), hasDup: false, dup: '', remove: () => this.toggle('profile', p.id, p.name) }; }
      const t = D.T[c.id]; if (!t) return null;
      const dp = cartProfiles.find(p => p.tests.includes(t.id));
      return { name: t.name, sub: 'Test · ' + t.params + ' parameter' + (t.params > 1 ? 's' : '') + ' · Reports in ' + t.tat, icon: 'test-tube', iconBg: '#F5F5FA', iconFg: '#16133A', priceF: inr(t.price), mrpF: inr(t.mrp), hasDup: !!dp, dup: dp ? 'Already included in ' + dp.name : '', remove: () => this.toggle('test', t.id, t.short) };
    }).filter(Boolean);

    const modeStyle = a => ({ bd: a ? '#3B2C9E' : '#ECEBF3', bg: a ? '#F4F2FE' : '#fff', ring: a ? '#3B2C9E' : '#C9C6DA', dot: a ? '#3B2C9E' : 'transparent' });
    const isHomeMode = s.mode === 'home';
    const setF = (k, clean) => e => { let v = e.target.value; if (clean) v = clean(v); this.setState(st => ({ form: { ...st.form, [k]: v }, errors: { ...st.errors, [k]: undefined } })); };
    const digits = n => v => v.replace(/\D/g, '').slice(0, n);
    const bcOf = k => s.errors[k] ? '#E5484D' : '#E7E6F0';
    const days = this.days();
    const nowH = new Date().getHours();
    const isToday = s.form.date === (days[0] || {}).key;
    const slots = C.SLOTS.map(([label, start]) => {
      const dis = isToday && start <= nowH, a = s.form.slot === label;
      return { label, disabled: dis, pick: () => !dis && this.setState(st => ({ form: { ...st.form, slot: label }, errors: { ...st.errors, slot: undefined } })), bd: a ? '#3B2C9E' : '#E7E6F0', bg: a ? '#3B2C9E' : dis ? '#F6F6FA' : '#fff', fg: a ? '#fff' : dis ? '#A9A6BD' : '#16133A', cursor: dis ? 'not-allowed' : 'pointer', td: dis ? 'line-through' : 'none' };
    });

    const n = D.P.length, ri = s.reelIdx;
    const stH = Math.round(Math.min(s.h * 0.9, 860));
    const reels = s.reelsOpen ? D.P.map(p => {
      const sl = s.slides[p.i] || 0, inC = has('profile', p.id);
      return { sym: p.sym, slotId: 'profile-bg-' + p.id, ...this.photo('profile-bg-' + p.id),   bg: `radial-gradient(70% 50% at 100% 0%, oklch(0.93 0.05 ${p.hue} / 0.9), transparent 70%), linear-gradient(170deg, #FFFFFF 0%, #F7F6FC 100%)`, tag: p.tag, name: p.name, tagline: p.tagline, params: p.params, testsN: p.tests.length, ideal: p.ideal, benefits: p.benefits, tat: p.tat,
        fastLabel: p.fasting ? '10–12 hr fasting' : 'No fasting needed', tests: p.ts.map((t, k) => ({ n: k + 1, name: t.name, p: t.params + (t.params > 1 ? ' params' : ' param') })),
        mrpF: inr(p.mrp), priceF: inr(p.price), off: off(p.mrp, p.price),
        segs: [0, 1, 2].map(k => ({ w: k === sl ? '22px' : '7px', bg: k === sl ? '#3B2C9E' : '#D4D1E6', go: () => this.goSlide(p.i, k) })), onH: e => this.onH(p.i, e), toTests: () => this.goSlide(p.i, 1),
        toggle: () => this.toggle('profile', p.id, p.name), addIcon: inC ? 'check' : 'plus', addLabel: inC ? 'Added' : 'Add', addText: inC ? 'In cart' : 'Add to cart', addBg: inC ? '#3B2C9E' : '#fff', addInk: inC ? '#fff' : '#16133A',
        share: () => this.share(p), book: book(p) };
    }) : [];
    const cur = D.P[ri] || D.P[0];
    const heroW = D.PM.women, heroV = D.PM.vitamin;

    const showTabs = isMobile && !s.reelsOpen && !(pg === 'cart' && hasCart);
    const showTestsBar = isMobile && !isWide && pg === 'tests' && hasCart && !s.reelsOpen;
    const showCartBar = isMobile && pg === 'cart' && hasCart && !s.reelsOpen;
    const showFab = !s.reelsOpen && pg !== 'cart' && !showTestsBar && !(isMobile && pg === 'home' && !s.scrolled);
    // On mobile the WhatsApp button sits above the tab bar, so clear both.
    const spacerH = 'calc(' + (showCartBar ? '92px' : showTestsBar ? (ms.length ? '200px' : '150px') : showTabs ? (showFab ? '156px' : '92px') : '0px') + ' + ' + barPad + ')';
    const tabC = p => pgN === p ? '#3B2C9E' : '#5D5A7A';

    return {
      isDesktop, isMobile, isWide, isHome: pg === 'home', isTests: pg === 'tests', isProfiles: pg === 'profiles', isCart: pg === 'cart', isAbout: pg === 'about', isTest: !!td, td: td || {}, backTests: go('tests'),
      goHome: go('home'), goTests: go('tests'), goProfiles: go('profiles'), goCart: go('cart'), nav,
      openReels0: () => this.openReels(0), hasCart, cartEmpty: !hasCart, cartCount, profileCount: n,
      locOpen: s.locOpen, toggleLoc: () => this.setState(st => ({ locOpen: !st.locOpen })),
      locLabel: (s.region && s.region.city ? s.region.city + ', ' : '') + RG.name,
      postPh: RG.postPh, addrPh: 'House / flat no., street, landmark, ' + RG.postLabel.toLowerCase(), regionPlace: (s.region && s.region.city ? s.region.city + ', ' : '') + RG.name, regionAddr: (this.props || {})[RG.addrProp] || RG.addrDef, relocate: () => this.locate(),
      ...(() => {
        const regs = Object.values(C.REGIONS), k = (s.tick || 0) % regs.length;
        const rows = regs.map((r, i) => { const on = i === k; return { dotW: on ? '20px' : '6px', dotBg: on ? '#3B2C9E' : '#D4D1E6', name: r.name, code: r.code === 'SA' ? 'KSA' : r.code, go: () => this.setState({ tick: i }) }; });
        // 10 centre photo slots; the list is doubled so the marquee loops seamlessly.
        const all = Array.from({ length: 10 }, (_, i) => ({ id: 'centre-photo-' + (i + 1), ...this.photo('centre-photo-' + (i + 1)), ph: 'Centre photo ' + (i + 1) }));
        return { centreRows: rows, centreY: 'translateY(' + (-k * 46) + 'px)', centreCount: regs.length, centreShots: all.concat(all) };
      })(),
      // Hero slides feature these profiles by id; they may be unpublished or reordered in the admin.
      hero1Mrp: heroW ? inr(heroW.mrp) : '', hero1Price: heroW ? inr(heroW.price) : '', hero2Mrp: heroV ? inr(heroV.mrp) : '', hero2Price: heroV ? inr(heroV.price) : '',
      ...gateVM,
      smTests: s.sMode === 'tests' ? segOn : segOff, smProfiles: s.sMode === 'profiles' ? segOn : segOff,
      setModeTests: () => this.setState({ sMode: 'tests' }), setModeProfiles: () => this.setState({ sMode: 'profiles' }),
      q: s.q, onQ: e => this.setState({ q: e.target.value, qFocus: true }), onQFocus: () => this.setState({ qFocus: true }), onQBlur: () => setTimeout(() => this.setState({ qFocus: false }), 150),
      onQKey: e => { if (e.key === 'Enter') { e.target.blur(); this.renderVals().submitSearch(); } else if (e.key === 'Escape') e.target.blur(); },
      submitSearch: () => { if (s.sMode === 'tests') { this.setState({ tq: s.q, cat: 'all', qFocus: false }); this.go('tests'); } else { const r = results[0]; if (r) r.open(); } },
      qPlaceholder: s.sMode === 'tests' ? 'Search Vitamin D, thyroid, HbA1c…' : "Search women's health, PCOS…",
      showResults: s.qFocus, keepFocus: e => e.preventDefault(), resultsLabel, results, noResults: !!q && !results.length,
      tileNext: () => { const el = document.querySelector('[data-tile-row]'); if (!el) return; const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4; el.scrollTo({ left: end ? 0 : el.scrollLeft + Math.max(240, el.clientWidth * 0.75), behavior: 'smooth' }); }, cats, catNext: () => { const el = document.querySelector('[data-cat-row]'); if (!el) return; const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4; el.scrollTo({ left: end ? 0 : el.scrollLeft + Math.max(200, el.clientWidth * 0.7), behavior: 'smooth' }); },
      heroX: 'translateX(-' + (s.hero * 100) + '%)', heroPrev: () => this.setState(st => ({ hero: (st.hero + 2) % 3 })), heroNext: () => this.setState(st => ({ hero: (st.hero + 1) % 3 })),
      heroDots: [0, 1, 2].map(i => ({ w: s.hero === i ? '26px' : '8px', bg: s.hero === i ? '#3B2C9E' : '#D4D1E6', go: () => this.setState({ hero: i }) })),
      heroTS: e => { this._hx = e.touches[0].clientX; }, heroTE: e => { const dx = e.changedTouches[0].clientX - (this._hx || 0); if (Math.abs(dx) > 40) this.setState(st => ({ hero: (st.hero + (dx < 0 ? 1 : 2)) % 3 })); },
      heroGo1: () => (heroW ? this.openReels(heroW.i) : this.go('profiles')), heroGo2: () => (heroV ? this.openReels(heroV.i) : this.go('profiles')),
      directions: () => window.open('https://www.google.com/maps/search/?api=1&query=AVM+Labs', '_blank', 'noopener'),
      waGeneral: () => this.openWA("Hi AVM Labs! I'd like to know more about your tests and profiles."),
      // Mobile header + home: location block, search toggle, and the Tests/Profiles icon row.
      locCity: (s.region && s.region.city) || RG.name, logoH: isDesktop ? 'clamp(60px,6.8vw,80px)' : '44px', spacerFlex: isDesktop ? '1' : '0',
      mSearchOpen: isMobile && !!s.mSearch, mSearchBg: s.mSearch ? '#EFEDFB' : '#fff', mSearchIcon: s.mSearch ? 'x' : 'search', mSearchText: s.mSearch ? 'Close' : 'Search tests',
      toggleMSearch: () => {
        const open = !s.mSearch;
        this.setState({ mSearch: open, qFocus: false, locOpen: false });
        if (open) { if (pg !== 'home') this.go('home'); setTimeout(() => { const el = document.querySelector('[data-type-ph]'); if (el) el.focus(); }, 60); }
      },
      mRow: s.sMode === 'profiles'
        ? D.P.map(p => ({ label: p.name, icon: C.PICON[p.id] || 'layers', soft: `oklch(0.94 0.045 ${p.hue})`, ink: `oklch(0.48 0.16 ${p.hue})`, go: () => this.openReels(p.i) }))
        : cats.map(c => ({ label: c.label, icon: c.icon, soft: c.soft, ink: c.ink, go: c.go })),
      // Lift the hero "Explore profiles" bar so it centres on the category circles beside it (labels sit below them).
      exploreMb: isDesktop ? '43px' : '0px',
      rowDisplay: isDesktop ? 'grid' : 'flex', rowOverflow: isDesktop ? 'visible' : 'auto',
      reelTiles: D.P.map(p => ({ slotId: 'profile-bg-' + p.id, ...this.photo('profile-bg-' + p.id), name: p.name, tag: p.tag, sym: p.sym, params: p.params, priceF: inr(p.price), mrpF: inr(p.mrp), bg: reelBg(p.hue), open: () => this.openReels(p.i) })),
      popular: C.POPULAR.map(id => testVM(D.T[id])),
      catTitle: s.cat === 'all' ? 'All lab tests' : (C.CATS.find(c => c.id === s.cat) || {}).label + ' tests',
      testsCountLabel: tList.length + (tList.length === 1 ? ' test' : ' tests'),
      tq: s.tq, onTq: e => this.setState({ tq: e.target.value }), hasTq: !!s.tq, clearTq: () => this.setState({ tq: '' }),
      testCats, testsView: tList.map(testVM), testsEmpty: !tList.length,
      barCountLabel: cartCount + (cartCount === 1 ? ' item' : ' items'),
      cartPreview: cartLines.slice(0, 5).map(l => ({ name: l.name, priceF: l.priceF })),
      topMatch: ms.slice(0, 1), cartMatches: ms.slice(0, 2),
      profFilters: C.PF.map(([id, label]) => { const a = s.pf === id; return { label, go: () => this.setState({ pf: id }), bg: a ? '#16133A' : '#fff', fg: a ? '#fff' : '#16133A', bd: a ? '#16133A' : '#E7E6F0' }; }),
      profilesView: D.P.filter(p => s.pf === 'all' || p.tags.includes(s.pf)).map(p => {
        const inC = has('profile', p.id);
        return { name: p.name, tag: p.tag, sym: p.sym, tagline: p.tagline, testsN: p.tests.length, params: p.params, fastLabel: p.fasting ? 'Fasting needed' : 'No fasting',
          soft: `linear-gradient(160deg, oklch(0.94 0.04 ${p.hue}), oklch(0.985 0.012 ${p.hue}))`, symColor: `oklch(0.45 0.16 ${p.hue} / 0.14)`, slotId: 'profile-bg-' + p.id, ...this.photo('profile-bg-' + p.id), veil: `linear-gradient(90deg, oklch(0.95 0.035 ${p.hue} / 0.97) 0%, oklch(0.95 0.035 ${p.hue} / 0.94) 58%, oklch(0.95 0.035 ${p.hue} / 0.6) 78%, oklch(0.95 0.035 ${p.hue} / 0) 96%), linear-gradient(0deg, oklch(0.97 0.02 ${p.hue} / 0.6), transparent 45%)`, ink: `oklch(0.42 0.15 ${p.hue})`,
          preview: p.ts.slice(0, 4).map(t => t.short), hasMore: p.ts.length > 4, moreLabel: '+' + (p.ts.length - 4) + ' more',
          mrpF: inr(p.mrp), off: off(p.mrp, p.price), priceF: inr(p.price), inCart: inC, notInCart: !inC, toggle: () => this.toggle('profile', p.id, p.name), open: () => this.openReels(p.i), book: book(p) };
      }),
      cartLines, pickHome: () => this.setState({ mode: 'home' }), 
      modeHome: modeStyle(isHomeMode), isHomeMode,
      hcBig: b.raw < o.freeAbove ? inr(o.fee) : 'FREE', hcSub: b.raw < o.freeAbove ? 'Free on orders above ' + inr(o.freeAbove) : inr(o.fee) + ' collection fee waived',
      form: s.form, err: s.errors, dial: RG.dial, phPh: RG.phPh, phPad: (RG.dial.length * 10 + 24) + 'px', idLabel: RG.idLabel + (RG.idOpt ? ' (optional)' : ''), idPh: RG.idPh,
      on: { name: setF('name'), phone: setF('phone', digits(RG.phLen)), nid: setF('nid', digits(RG.idLen)), age: setF('age', digits(3)), address: setF('address') },
      bc: { name: bcOf('name'), phone: bcOf('phone'), nid: bcOf('nid'), age: bcOf('age'), gender: bcOf('gender'), address: bcOf('address') },
      genders: ['Male', 'Female', 'Other'].map(g => { const a = s.form.gender === g; return { label: g, pick: () => this.setState(st => ({ form: { ...st.form, gender: g }, errors: { ...st.errors, gender: undefined } })), bg: a ? '#fff' : 'transparent', fg: a ? '#3B2C9E' : '#5D5A7A', sh: a ? '0 2px 8px -2px rgba(22,19,58,0.2)' : 'none' }; }),
      slotTitle: isHomeMode ? 'Collection date & time' : 'Visit date & time', placeTitle: isHomeMode ? 'Collection address' : 'Visit our centre',
      days: days.map(d => { const a = s.form.date === d.key; return { top: d.top, bottom: d.bottom, pick: () => this.setState(st => ({ form: { ...st.form, date: d.key, slot: d.i === 0 ? '' : st.form.slot }, errors: { ...st.errors, date: undefined } })), bd: a ? '#3B2C9E' : '#E7E6F0', bg: a ? '#3B2C9E' : '#fff', fg: a ? '#fff' : '#16133A' }; }),
      slots, asidePos: isWide ? 'sticky' : 'static',
      bill: { mrpF: this.money(b.mrp), priceF: this.money(b.price), savingF: this.money(b.saving), hcF: b.hc ? this.money(b.hc) : 'FREE', hcColor: b.hc ? '#16133A' : '#0E7350', payF: this.money(b.pay), totalSaveF: this.money(Math.max(0, b.mrp - b.pay)) },
      confirm: () => this.confirm(),
      isBooked: !!s.booked, bookedUrl: s.booked ? s.booked.url : '#',
      finishBooked: () => { this.setCart(() => []); this.setState({ booked: null }); this.go('home'); },
      footTests: ['vitd', 'thyroid', 'hba1c', 'cbc', 'lipid'].map(id => ({ label: D.T[id].short === 'Thyroid Profile' ? 'Thyroid Profile' : D.T[id].short + ' test', go: () => this.openTest(id) })),
      footLinks: [['Home', 'home'], ['All tests', 'tests'], ['Health profiles', 'profiles'], ['About us', 'about']].map(([label, p]) => ({ label, go: go(p) })),
      spacerH, showTabs, showTestsBar, showCartBar, tab: { home: tabC('home'), tests: tabC('tests'), profiles: tabC('profiles'), cart: tabC('cart') },
      showFab, fabBottom: isMobile ? 'calc(92px + ' + barPad + ')' : '24px',
      hasToast: !!s.toast, toast: s.toast, toastBottom: 'calc(' + (showCartBar ? '96px' : showTabs ? '100px' : '28px') + ' + ' + barPad + ')',
      reelsOpen: s.reelsOpen, reels, reelsRef: this.reelsRef, onReelsScroll: e => this.onReelsScroll(e), closeReels: () => this.closeReels(),
      stageW: isDesktop ? Math.round(stH * 9 / 16) + 'px' : '100%', stageH: isDesktop ? stH + 'px' : '100%', stageR: isDesktop ? '28px' : '0px',
      reelAmbient: `radial-gradient(60% 60% at 50% 30%, oklch(0.93 0.04 275 / 0.7), transparent 70%)`,
      reelList: D.P.map(p => ({ sym: p.sym, icon: C.PICON[p.id] || 'layers', soft: `oklch(0.94 0.045 ${p.hue})`, ink: `oklch(0.48 0.16 ${p.hue})`, dot: `oklch(0.55 0.17 ${p.hue})`, name: p.name, meta: p.tests.length + ' tests · ' + inr(p.price), go: () => this.goReel(p.i), bg: p.i === ri ? '#EEECF8' : 'transparent', bd: p.i === ri ? '#D9D5F0' : 'transparent' })),
      mobileReels: s.reelsOpen && isMobile, desktopReels: s.reelsOpen && isDesktop, reelDots: D.P.map(p => ({ h: p.i === ri ? '26px' : '8px', bg: p.i === ri ? '#3B2C9E' : '#D4D1E6', go: () => this.goReel(p.i) })), reelUp: () => this.goReel(this.cur() - 1), reelDown: () => this.goReel(this.cur() + 1), reelPos: (ri + 1) + ' / ' + n,
      prevSlide: () => { const i = this.cur(); this.goSlide(i, (this.state.slides[i] || 0) - 1); }, nextSlide: () => { const i = this.cur(); this.goSlide(i, (this.state.slides[i] || 0) + 1); },
      reelPadB, barPad, tabBottom: 'calc(10px + ' + barPad + ')', testsBarBottom: 'calc(86px + ' + barPad + ')', cartPadB: 'calc(12px + ' + barPad + ')', slidePadB: 'calc(134px + ' + reelPadB + ')', railBottom: 'calc(152px + ' + reelPadB + ')',
      reelHint: !!s.hint && isMobile, hintDir: s.hint || 'up', hintIcon: 'chevron-' + (s.hint || 'up'),
      hintLabel: s.hint === 'left' ? 'details' : s.hint === 'down' ? 'back' : 'next'
    };
  }
