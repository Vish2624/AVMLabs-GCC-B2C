  renderVals() {
    // Fixed elements already sit above the browser toolbar; only clear the home-indicator safe area.
    const barPad = 'env(safe-area-inset-bottom, 0px)';
    const reelPadB = 'calc(16px + ' + barPad + ')';
    const s = this.state, D = this.db(), C = Component, RG = this.region();
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
    const cost = x => this.cost(x);
    // Search matches the test name, short name, any alias ("also known as") or its category, ignoring case,
    // and also ignoring spaces and punctuation, so "b12" finds Vitamin B-12 and "hba1c" finds HbA1c.
    const flat = v => v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const catLabel = id => (C.CATS.find(c => c.id === id) || {}).label || '';
    const findsTest = (t, q) => { if (!q) return true; const hay = t.name + ' ' + t.short + ' ' + (t.aka || '') + ' ' + t.cat.map(catLabel).join(' '), fq = flat(q); return hay.toLowerCase().includes(q) || (fq.length > 1 && flat(hay).includes(fq)); };
    // Most booked first (popularity rank from the test master); the first 20 are the popular tests.
    const byRank = [...C.TESTS].sort((a, b) => (a.rank || 9999) - (b.rank || 9999)), popularTests = byRank.slice(0, 20);
    // Search results: a test whose name, short name or an alias is exactly the query (e.g. "Fe" for Iron) comes first,
    // then ones starting with it, then any other match; each group stays in popularity order.
    const searchTests = (list, q) => {
      if (!q) return list;
      const fq = flat(q), score = t => { const names = [t.name, t.short, ...(t.aka || '').split(',')].map(n => flat(n)); return names.includes(fq) ? 2 : names.some(n => n.startsWith(fq)) ? 1 : 0; };
      return list.filter(t => findsTest(t, q)).map(t => [score(t), t]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    };
    const isDesktop = s.w >= 1024, isMobile = !isDesktop, isWide = s.w >= 1080;
    const pg = s.page, pgN = pg === 'test' ? 'tests' : pg;
    const cartCount = s.cart.length, hasCart = cartCount > 0;
    const go = p => () => this.go(p);
    const has = (t, id) => s.cart.some(c => c.type === t && c.id === id);
    const reelBg = h => `radial-gradient(70% 55% at 100% 0%, oklch(0.62 0.16 ${h} / 0.42), transparent 70%), radial-gradient(80% 60% at 0% 100%, oklch(0.42 0.17 275 / 0.55), transparent 70%), linear-gradient(160deg, #1D1852 0%, #141039 55%, #0E0B2B 100%)`;

    const coveredBy = id => s.cart.filter(c => c.type === 'profile').map(c => D.PM[c.id]).find(p => p && p.tests.includes(id));
    const testVM = t => {
      const inC = has('test', t.id), cov = !inC && coveredBy(t.id);
      const pc = C.CATS.find(c => c.id === t.cat[0]) || C.CATS[0];
      return { name: t.name, catLabel: pc.label, icon: pc.icon, soft: `oklch(0.95 0.035 ${pc.hue})`, ring: `oklch(0.88 0.06 ${pc.hue})`, ink: `oklch(0.5 0.15 ${pc.hue})`, tatH: this.tat(t).replace('hrs', 'hours'), paramsCap: t.params + (t.params > 1 ? ' Parameters' : ' Parameter'), cardBg: 'radial-gradient(75% 70% at 100% 0%, #F0EDFE 0%, rgba(240,237,254,0) 65%), radial-gradient(55% 50% at 0% 100%, rgba(255,236,240,0.55) 0%, rgba(255,236,240,0) 70%), #FFFFFF', tat: this.tat(t), fasting: t.fasting,
        open: () => this.openTest(t.id),
        priceF: cost(t), priceNum: this.costParts(t).num, priceCur: this.costParts(t).cur, underMin: this.pr(t) > 0 && this.pr(t) < RG.minBill, minNote: this.minBillNote(), inCart: inC, notInCart: !inC && !cov, covered: !!cov, coveredBy: cov ? 'In ' + cov.name : '', toggle: e => { e && e.stopPropagation(); this.toggle('test', t.id, t.short); }, stop: e => e && e.stopPropagation() };
    };
    let td = null;
    if (pg === 'test' && s.testId && D.T[s.testId]) {
      const t = D.T[s.testId], vm = testVM(t), sample = t.sample || 'Blood';
      const measured = t.parameters && t.parameters.length ? t.parameters : [t.name], calc = t.calculated || [];
      const ps = D.inProf[t.id] || [];
      td = { ...vm, aka: t.aka || '', hasAka: !!t.aka, about: t.about || '',
        params: [...measured.map(name => ({ name, calc: false })), ...calc.map(name => ({ name, calc: true }))].map((x, k) => ({ ...x, n: k + 1 })),
        paramsTitle: t.params + (t.params > 1 ? ' parameters' : ' parameter') + (calc.length ? ' · ' + calc.length + ' calculated' : ''),
        sample, sampleIcon: sample === 'Urine' ? 'flask-conical' : 'droplet', fastTitle: t.fasting ? 'Fasting required' : 'No fasting required', fastSub: t.fasting ? '10–12 hrs overnight, water is fine' : 'Eat and drink as usual',
        reportT: 'Report in ' + this.tat(t), book: () => this.bookWA([{ type: 'test', id: t.id }]),
        profs: ps.map(p => ({ name: p.name, meta: p.tests.length + ' tests · ' + cost(p), sym: p.sym, icon: C.PICON[p.id] || 'layers', soft: `oklch(0.94 0.045 ${p.hue})`, ink: `oklch(0.48 0.16 ${p.hue})`, dot: `oklch(0.55 0.17 ${p.hue})`, open: () => this.openReels(p.i) })), toProfs: () => { const el = document.querySelector('[data-td-profs]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, hasProfs: ps.length > 0 };
    }
    const book = p => () => this.bookWA([{ type: 'profile', id: p.id }]);

    const nav = [['Home', 'home'], ['Tests', 'tests'], ['Profiles', 'profiles'], ['About us', 'about']].map(([label, p]) => ({ label, go: go(p), bg: pgN === p ? '#EFEDFB' : 'transparent', fg: pgN === p ? '#3B2C9E' : '#16133A' }));
    const segOn = { bg: '#fff', fg: '#16133A', sh: '0 2px 8px -2px rgba(22,19,58,0.2)' }, segOff = { bg: 'transparent', fg: '#5D5A7A', sh: 'none' };

    const q = s.q.trim().toLowerCase();
    let results = [], resultsLabel = '';
    if (s.sMode === 'tests') {
      const list = q ? searchTests(byRank, q) : popularTests;
      resultsLabel = q ? 'Tests' : 'Most booked';
      results = list.slice(0, 6).map(t => { const inC = has('test', t.id), cov = !inC && coveredBy(t.id); return { name: t.name, meta: t.params + ' parameter' + (t.params > 1 ? 's' : '') + ' · Reports in ' + this.tat(t), priceF: cost(t), open: () => this.openTest(t.id), action: () => !cov && this.toggle('test', t.id, t.short), alabel: inC ? 'Added' : cov ? 'Included' : 'Add', abg: inC ? '#3B2C9E' : cov ? '#EAF7EF' : '#fff', afg: inC ? '#fff' : cov ? '#0E7350' : '#3B2C9E' }; });
    } else {
      const list = q ? D.P.filter(p => (p.name + ' ' + p.tag + ' ' + p.tagline).toLowerCase().includes(q)) : D.P;
      resultsLabel = q ? 'Profiles' : 'Popular profiles';
      results = list.slice(0, 6).map(p => ({ name: p.name, meta: p.tests.length + ' tests · ' + p.params + ' parameters', priceF: cost(p), open: () => this.openReels(p.i), action: () => this.openReels(p.i), alabel: 'View', abg: '#fff', afg: '#3B2C9E' }));
    }

    const cats = C.CATS.map(c => ({ ...c, name: c.short || c.label, soft: `oklch(0.95 0.035 ${c.hue})`, ink: `oklch(0.5 0.15 ${c.hue})`, grad: `linear-gradient(150deg, oklch(0.97 0.03 ${c.hue}) 0%, oklch(0.91 0.06 ${c.hue}) 100%)`, ring: `oklch(0.85 0.07 ${c.hue})`, count: C.TESTS.filter(t => t.cat.includes(c.id)).length, go: () => { this.setState({ cat: c.id, tq: '' }); this.go('tests'); } }));
    const tq = s.tq.trim().toLowerCase();
    const tList = searchTests(byRank.filter(t => s.cat === 'all' || t.cat.includes(s.cat)), tq);
    const testCats = [{ id: 'all', label: 'All tests', sym: 'All', icon: 'layout-grid', soft: '#EFEDFB', ink: '#3B2C9E', count: C.TESTS.length }, ...cats].map(c => {
      const a = s.cat === c.id;
      return { sym: c.sym, icon: c.icon, label: c.label, count: c.count, go: () => this.setState({ cat: c.id }), bg: a ? '#16133A' : '#fff', fg: a ? '#fff' : '#16133A', bd: a ? '#16133A' : '#E7E6F0', symBg: a ? 'rgba(255,255,255,0.16)' : c.soft, symFg: a ? '#fff' : c.ink };
    });

    const b = this.bill();
    const ms = this.matches().map(m => this.matchVM(m));
    const cartProfiles = s.cart.filter(c => c.type === 'profile').map(c => D.PM[c.id]).filter(Boolean);
    const cartLines = s.cart.map(c => {
      if (c.type === 'profile') { const p = D.PM[c.id]; if (!p) return null; return { name: p.name, sub: 'Profile · ' + p.tests.length + ' tests · ' + p.params + ' parameters', icon: 'layers', iconBg: '#EFEDFB', iconFg: '#3B2C9E', priceF: cost(p), hasDup: false, dup: '', remove: () => this.toggle('profile', p.id, p.name) }; }
      const t = D.T[c.id]; if (!t) return null;
      const dp = cartProfiles.find(p => p.tests.includes(t.id));
      return { name: t.name, sub: 'Test · ' + t.params + ' parameter' + (t.params > 1 ? 's' : '') + ' · Reports in ' + this.tat(t), icon: 'test-tube', iconBg: '#F5F5FA', iconFg: '#16133A', priceF: cost(t), hasDup: !!dp, dup: dp ? 'Already included in ' + dp.name : '', remove: () => this.toggle('test', t.id, t.short) };
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
      return { label, disabled: dis, icon: start < 8 ? 'sunrise' : start < 16 ? 'sun' : start < 18 ? 'sunset' : 'moon', part: start < 12 ? 'Morning' : start < 16 ? 'Afternoon' : 'Evening',
        pick: () => !dis && this.setState(st => ({ form: { ...st.form, slot: label }, errors: { ...st.errors, slot: undefined } })), bd: a ? '#3B2C9E' : '#E7E6F0', bg: a ? '#3B2C9E' : dis ? '#F6F6FA' : '#fff', fg: a ? '#fff' : dis ? '#A9A6BD' : '#16133A', sub: a ? 'rgba(255,255,255,0.75)' : '#8A8698', ico: a ? '#fff' : dis ? '#C9C6DA' : '#3B2C9E', sh: a ? '0 10px 22px -12px rgba(59,44,158,0.8)' : 'none', cursor: dis ? 'not-allowed' : 'pointer', td: dis ? 'line-through' : 'none' };
    });
    const pickedDay = days.find(d => d.key === s.form.date);

    const n = D.P.length, ri = s.reelIdx;
    const stH = Math.round(Math.min(s.h * 0.9, 860));
    // "What's included" rows. Profiles with several sub-profiles list those (tap: their tests and parameters);
    // otherwise each test is a row (tap: its parameters).
    const plural = (k, w) => k + ' ' + w + (k === 1 ? '' : 's');
    // A test inside an open row: its name (unless the row is that test) and its parameters as tags,
    // calculated ones in their own group. A lone parameter that just repeats the test's name isn't shown.
    const incTest = (t, showName) => {
      const params = (t.parameters || []).filter(x => !(t.parameters.length === 1 && !(t.calculated || []).length && x.toLowerCase() === t.name.toLowerCase()));
      const calcs = t.calculated || [];
      return { name: t.name, showName, params, calcs, hasParams: params.length > 0, hasCalcs: calcs.length > 0 };
    };
    const incGroups = p => {
      const subs = (p.subs || []).map(x => ({ name: x.name, ts: x.tests.map(id => D.T[id]).filter(Boolean) })).filter(x => x.ts.length);
      return subs.length > 1
        ? subs.map((x, k) => ({ n: k + 1, name: x.name, meta: plural(x.ts.length, 'test') + ' · ' + plural(x.ts.reduce((a, t) => a + t.params, 0), 'param'), items: x.ts.map(t => incTest(t, true)) }))
        : p.ts.map((t, k) => ({ n: k + 1, name: t.name, meta: plural(t.params, 'param'), items: [incTest(t, false)] }));
    };
    const reels = s.reelsOpen ? D.P.map(p => {
      const sl = s.slides[p.i] || 0, inC = has('profile', p.id), worth = this.sumPr(p.ts);
      return { sym: p.sym, slotId: 'profile-bg-' + p.id, ...this.photo('profile-bg-' + p.id),   bg: `radial-gradient(70% 50% at 100% 0%, oklch(0.93 0.05 ${p.hue} / 0.9), transparent 70%), linear-gradient(170deg, #FFFFFF 0%, #F7F6FC 100%)`, tag: p.tag, name: p.name, tagline: p.tagline, params: p.params, testsN: p.tests.length, ideal: p.ideal, hasIdeal: p.ideal.length > 0, benefits: p.benefits, hasBenefits: p.benefits.length > 0, tat: this.tat(p),
        fastLabel: p.fasting ? '10–12 hr fasting' : 'No fasting needed', tests: p.ts.map((t, k) => ({ n: k + 1, name: t.name, p: t.params + (t.params > 1 ? ' params' : ' param') })), groups: incGroups(p),
        // What its tests cost one by one, shown only when the profile is cheaper.
        priceF: cost(p), worthF: this.money(worth), hasWorth: worth > this.pr(p) + 0.0001,
        segs: [0, 1, 2].map(k => ({ w: k === sl ? '22px' : '7px', bg: k === sl ? '#3B2C9E' : '#D4D1E6', go: () => this.goSlide(p.i, k) })), onH: e => this.onH(p.i, e), toTests: () => this.goSlide(p.i, 1),
        toggle: () => this.toggle('profile', p.id, p.name), addIcon: inC ? 'check' : 'plus', addLabel: inC ? 'Added' : 'Add', addText: inC ? 'In cart' : 'Add to cart', addBg: inC ? '#3B2C9E' : '#fff', addInk: inC ? '#fff' : '#16133A', popping: inC && s.pop === p.id, addPop: inC && s.pop === p.id ? '1' : '0',
        share: () => this.share(p), book: book(p) };
    }) : [];
    const cur = D.P[ri] || D.P[0];
    const heroW = D.PM['women-hormone-plus'], heroV = D.PM['vitamin-profile'];

    const hasTabs = isMobile && !s.reelsOpen && !(pg === 'cart' && hasCart);
    const hasTestsBar = isMobile && !isWide && pg === 'tests' && hasCart && !s.reelsOpen;
    const hasCartBar = isMobile && pg === 'cart' && hasCart && !s.reelsOpen;
    // The WhatsApp button always floats (except over the reels), above whichever bar is at the bottom.
    const hasFab = !s.reelsOpen;
    // s.kb: a text field is focused on a phone, so the keyboard is up; bottom bars step aside.
    const showTabs = hasTabs && !s.kb, showTestsBar = hasTestsBar && !s.kb, showCartBar = hasCartBar && !s.kb, showFab = hasFab && !s.kb;
    // On mobile the WhatsApp button sits above the tab bar, so clear both.
    // Sized from where the bars would be, so it doesn't change (and jump the page) when they hide for the keyboard.
    const spacerH = 'calc(' + (hasCartBar ? '92px' : hasTestsBar ? (ms.length ? '200px' : '150px') : hasTabs ? (hasFab ? '156px' : '92px') : '0px') + ' + ' + barPad + ')';
    const tabC = p => pgN === p ? '#3B2C9E' : '#5D5A7A';

    return {
      isDesktop, isMobile, isWide, isHome: pg === 'home', isTests: pg === 'tests', isProfiles: pg === 'profiles', isCart: pg === 'cart', isAbout: pg === 'about', isTest: !!td, td: td || {}, backTests: go('tests'),
      goHome: go('home'), goTests: go('tests'), goProfiles: go('profiles'), goCart: go('cart'), nav,
      openReels0: () => this.openReels(0), hasCart, cartEmpty: !hasCart, cartCount, profileCount: n,
      locOpen: s.locOpen, toggleLoc: () => this.setState(st => ({ locOpen: !st.locOpen })),
      locLabel: (s.region && s.region.city ? s.region.city + ', ' : '') + RG.name,
      regionPlace: (s.region && s.region.city ? s.region.city + ', ' : '') + RG.name, regionAddr: (this.props || {})[RG.addrProp] || RG.addrDef, relocate: () => this.locate(),
      ...(() => {
        const regs = Object.values(C.REGIONS), k = (s.tick || 0) % regs.length;
        const rows = regs.map((r, i) => { const on = i === k; return { dotW: on ? '20px' : '6px', dotBg: on ? '#3B2C9E' : '#D4D1E6', name: r.name, code: r.code === 'SA' ? 'KSA' : r.code, go: () => this.setState({ tick: i }) }; });
        // Photos of our Bahrain centre (assets/centres/), repeated to at least 6 tiles so half the strip is wider than the
        // screen; the list is then doubled so the marquee loops seamlessly.
        const one = C.CENTRE_PHOTOS.map(([file, ph]) => ({ photoSrc: './assets/centres/bahrain-' + file + '.jpg', photoCredit: '', photoHref: '', ph }));
        const all = Array.from({ length: Math.ceil(6 / one.length) * one.length }, (_, i) => ({ ...one[i % one.length], id: 'centre-' + i }));
        return { centreRows: rows, centreY: 'translateY(' + (-k * 46) + 'px)', centreCount: regs.length, centreShots: all.concat(all) };
      })(),
      // Hero slides feature these profiles by id; they may be unpublished or reordered in the admin.
      hero1Price: heroW ? cost(heroW) : '', hero2Price: heroV ? cost(heroV) : '',
      ...gateVM,
      smTests: s.sMode === 'tests' ? segOn : segOff, smProfiles: s.sMode === 'profiles' ? segOn : segOff,
      setModeTests: () => this.setState({ sMode: 'tests' }), setModeProfiles: () => this.setState({ sMode: 'profiles' }),
      q: s.q, onQ: e => this.setState({ q: e.target.value, qFocus: true }), onQFocus: () => this.setState({ qFocus: true }), onQBlur: () => setTimeout(() => this.setState({ qFocus: false }), 150),
      onQKey: e => { if (e.key === 'Enter') { e.target.blur(); this.renderVals().submitSearch(); } else if (e.key === 'Escape') e.target.blur(); },
      submitSearch: () => { if (s.sMode === 'tests') { this.setState({ tq: s.q, cat: 'all', qFocus: false }); this.go('tests'); } else { const r = results[0]; if (r) r.open(); } },
      qPlaceholder: s.sMode === 'tests' ? 'Search CBC, TSH, Vitamin D…' : 'Search wellness, hair fall, thyroid…',
      showResults: s.qFocus, keepFocus: e => e.preventDefault(), resultsLabel, results, noResults: !!q && !results.length,
      tileNext: () => { const el = document.querySelector('[data-tile-row]'); if (!el) return; const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4; el.scrollTo({ left: end ? 0 : el.scrollLeft + Math.max(240, el.clientWidth * 0.75), behavior: 'smooth' }); }, cats, catNext: () => { const el = document.querySelector('[data-cat-row]'); if (!el) return; const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4; el.scrollTo({ left: end ? 0 : el.scrollLeft + Math.max(200, el.clientWidth * 0.7), behavior: 'smooth' }); },
      heroX: 'translateX(-' + (s.hero * 100) + '%)', heroPrev: () => this.setState(st => ({ hero: (st.hero + 3) % 4 })), heroNext: () => this.setState(st => ({ hero: (st.hero + 1) % 4 })),
      heroDots: [0, 1, 2, 3].map(i => ({ w: s.hero === i ? '26px' : '8px', bg: s.hero === i ? '#3B2C9E' : '#D4D1E6', go: () => this.setState({ hero: i }) })),
      // Swipe the hero card left/right; a mostly vertical drag is left to scroll the page.
      heroTS: e => { const t = e.touches[0]; this._hx = t.clientX; this._hy = t.clientY; },
      heroTE: e => { const t = e.changedTouches[0], dx = t.clientX - (this._hx || 0), dy = t.clientY - (this._hy || 0); if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) this.setState(st => ({ hero: (st.hero + (dx < 0 ? 1 : 3)) % 4 })); },
      heroGo1: () => (heroW ? this.openReels(heroW.i) : this.go('profiles')), heroGo2: () => (heroV ? this.openReels(heroV.i) : this.go('profiles')),
      directions: () => window.open('https://www.google.com/maps/search/?api=1&query=AVM+Labs', '_blank', 'noopener'),
      // With items in the cart, the footer/general WhatsApp buttons send the cart as a booking; otherwise a general enquiry.
      waGeneral: () => (s.cart.length ? this.bookWA(s.cart) : this.openWA("Hi AVM Labs! I'd like to know more about your tests and profiles.")),
      // Mobile header + home: location block, search toggle, and the Tests/Profiles icon row.
      locCity: (s.region && s.region.city) || RG.name, logoH: isDesktop ? 'clamp(60px,6.8vw,80px)' : '54px', spacerFlex: isDesktop ? '1' : '0',
      mSearchOpen: isMobile && !!s.mSearch, mSearchBg: s.mSearch ? '#EFEDFB' : '#fff', mSearchIcon: s.mSearch ? 'x' : 'search', mSearchText: s.mSearch ? 'Close' : 'Search tests',
      toggleMSearch: () => {
        const open = !s.mSearch;
        this.setState({ mSearch: open, qFocus: false, locOpen: false });
        if (open) { if (pg !== 'home') this.go('home'); setTimeout(() => { const el = document.querySelector('[data-type-ph]'); if (el) el.focus(); }, 60); }
      },
      mRow: s.sMode === 'profiles'
        ? D.P.map(p => ({ label: p.name, icon: C.PICON[p.id] || 'layers', soft: `oklch(0.94 0.045 ${p.hue})`, ink: `oklch(0.48 0.16 ${p.hue})`, go: () => this.openReels(p.i) }))
        : cats.map(c => ({ label: c.short || c.label, icon: c.icon, soft: c.soft, ink: c.ink, go: c.go })),
      // Lift the hero "Explore profiles" bar so it centres on the category circles beside it (labels sit below them).
      exploreMb: isDesktop ? '43px' : '0px',
      rowDisplay: isDesktop ? 'grid' : 'flex', rowOverflow: isDesktop ? 'visible' : 'auto',
      reelTiles: D.P.map(p => ({ slotId: 'profile-bg-' + p.id, ...this.photo('profile-bg-' + p.id), name: p.name, tag: p.tag, sym: p.sym, params: p.params, priceF: cost(p), bg: reelBg(p.hue), open: () => this.openReels(p.i) })),
      // Desktop: two rows of three. Mobile keeps all of them in one swipeable row.
      popular: (isDesktop ? popularTests.slice(0, 6) : popularTests).map(testVM),
      catTitle: s.cat === 'all' ? 'All lab tests' : (C.CATS.find(c => c.id === s.cat) || {}).label + ' tests',
      testsCountLabel: tList.length + (tList.length === 1 ? ' test' : ' tests'),
      tq: s.tq, onTq: e => this.setState({ tq: e.target.value }), hasTq: !!s.tq, clearTq: () => this.setState({ tq: '' }),
      testCats, testsView: tList.map(testVM), testsEmpty: !tList.length,
      barCountLabel: cartCount + (cartCount === 1 ? ' item' : ' items'), noBarNote: !(b.top > 0),
      cartPreview: cartLines.slice(0, 5).map(l => ({ name: l.name, priceF: l.priceF })),
      topMatch: ms.slice(0, 1), cartMatches: ms.slice(0, 2),
      profFilters: C.PF.map(([id, label]) => { const a = s.pf === id; return { label, go: () => this.setState({ pf: id }), bg: a ? '#16133A' : '#fff', fg: a ? '#fff' : '#16133A', bd: a ? '#16133A' : '#E7E6F0' }; }),
      profilesView: D.P.filter(p => s.pf === 'all' || p.tags.includes(s.pf)).map(p => {
        const inC = has('profile', p.id);
        return { name: p.name, tag: p.tag, sym: p.sym, tagline: p.tagline, testsN: p.tests.length, params: p.params, fastLabel: p.fasting ? 'Fasting needed' : 'No fasting',
          soft: `linear-gradient(160deg, oklch(0.94 0.04 ${p.hue}), oklch(0.985 0.012 ${p.hue}))`, slotId: 'profile-bg-' + p.id, ...this.photo('profile-bg-' + p.id), veil: `linear-gradient(90deg, oklch(0.95 0.035 ${p.hue} / 0.97) 0%, oklch(0.95 0.035 ${p.hue} / 0.94) 58%, oklch(0.95 0.035 ${p.hue} / 0.6) 78%, oklch(0.95 0.035 ${p.hue} / 0) 96%), linear-gradient(0deg, oklch(0.97 0.02 ${p.hue} / 0.6), transparent 45%)`, ink: `oklch(0.42 0.15 ${p.hue})`,
          preview: p.ts.slice(0, 4).map(t => t.short), hasMore: p.ts.length > 4, moreLabel: '+' + (p.ts.length - 4) + ' more',
          priceF: cost(p), inCart: inC, notInCart: !inC, toggle: () => this.toggle('profile', p.id, p.name), open: () => this.openReels(p.i, 1), book: book(p) };
      }),
      cartLines, pickHome: () => this.setState({ mode: 'home' }), pickWalk: () => this.setState({ mode: 'walkin' }),
      modeHome: modeStyle(isHomeMode), modeWalk: modeStyle(!isHomeMode), isHomeMode, isWalkMode: !isHomeMode,
      form: s.form, err: s.errors, dial: RG.dial, phPh: RG.phPh, phPad: (RG.dial.length * 10 + 24) + 'px',
      on: { name: setF('name'), phone: setF('phone', digits(RG.phLen)), age: setF('age', digits(3)) },
      bc: { name: bcOf('name'), phone: bcOf('phone'), age: bcOf('age'), gender: bcOf('gender') },
      genders: ['Male', 'Female', 'Other'].map(g => { const a = s.form.gender === g; return { label: g, pick: () => this.setState(st => ({ form: { ...st.form, gender: g }, errors: { ...st.errors, gender: undefined } })), bg: a ? '#fff' : 'transparent', fg: a ? '#3B2C9E' : '#5D5A7A', sh: a ? '0 2px 8px -2px rgba(22,19,58,0.2)' : 'none' }; }),
      slotTitle: isHomeMode ? 'Collection date & time' : 'Visit date & time',
      days: days.map(d => { const a = s.form.date === d.key; return { top: d.top, num: d.num, mon: d.mon, pick: () => this.setState(st => ({ form: { ...st.form, date: d.key, slot: d.i === 0 ? '' : st.form.slot }, errors: { ...st.errors, date: undefined } })), bd: a ? '#3B2C9E' : '#E7E6F0', bg: a ? '#3B2C9E' : '#fff', fg: a ? '#fff' : '#16133A', sub: a ? 'rgba(255,255,255,0.8)' : '#5D5A7A', sh: a ? '0 12px 24px -12px rgba(59,44,158,0.85)' : 'none', lift: a ? 'translateY(-2px)' : 'none' }; }),
      slots, slotPicked: !!(pickedDay && s.form.slot), slotSummary: pickedDay ? pickedDay.full + ' · ' + s.form.slot : '', asidePos: isWide ? 'sticky' : 'static',
      bill: { priceF: this.money(b.price), hcF: b.hc ? this.money(b.hc) : 'FREE', hcColor: b.hc ? '#16133A' : '#0E7350', payF: this.money(b.pay), hasTop: b.top > 0, topF: this.money(b.top), minShort: 'Add ' + this.money(b.top) + ' more to avoid minimum billing',
        minTitle: 'Add ' + this.money(b.top) + ' more to avoid the minimum billing charge',
        minSub: 'The minimum bill is ' + this.money(RG.minBill) + ' per patient. Add tests worth ' + this.money(b.top) + ' or more and you pay only for your tests.',
        minPct: Math.round(b.price / (b.pay || 1) * 100) + '%',
        // Popular tests that clear the charge on their own, to add in one tap.
        minAdds: b.top > 0 ? byRank.filter(t => !has('test', t.id) && !coveredBy(t.id) && this.pr(t) >= b.top).slice(0, 3).map(t => ({ name: t.short, priceF: cost(t), add: () => this.toggle('test', t.id, t.short) })) : [] },
      confirm: () => this.confirm(),
      isBooked: !!s.booked, bookedUrl: s.booked ? s.booked.url : '#',
      finishBooked: () => { this.setCart(() => []); this.setState({ booked: null }); this.go('home'); },
      toTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      footLinks:[['Home', 'home'], ['All tests', 'tests'], ['Health profiles', 'profiles'], ['About us', 'about']].map(([label, p]) => ({ label, go: go(p) })),
      spacerH, showTabs, showTestsBar, showCartBar, tab: { home: tabC('home'), tests: tabC('tests'), profiles: tabC('profiles'), cart: tabC('cart') },
      showFab, fabBottom: !isMobile ? '24px' : 'calc(' + (hasCartBar ? '104px' : hasTestsBar ? (ms.length ? '214px' : '160px') : '92px') + ' + ' + barPad + ')', fabAway: 'translate(0, var(--vv-drop, 0px))',
      // Removals show a minus, problems ("Please complete…", "Couldn't copy…") an alert, everything else a tick.
      ...(() => { const kind = /^Removed/.test(s.toast) ? 'off' : /^(Please|Couldn't)/.test(s.toast) ? 'bad' : 'ok';
        return { toastIcon: { off: 'minus', bad: 'circle-alert', ok: 'check' }[kind], toastDot: { off: 'rgba(255,255,255,0.18)', bad: '#E5484D', ok: '#22B463' }[kind] }; })(),
      hasToast: !!s.toast, toast: s.toast, toastTop: 'calc(' + (s.reelsOpen ? '72px' : '14px') + ' + env(safe-area-inset-top))',
      reelsOpen: s.reelsOpen, reels, reelsRef: this.reelsRef, onReelsScroll: e => this.onReelsScroll(e), closeReels: () => this.closeReels(),
      stageW: isDesktop ? Math.round(stH * 9 / 16) + 'px' : '100%', stageH: isDesktop ? stH + 'px' : '100%', stageR: isDesktop ? '28px' : '0px',
      reelAmbient: `radial-gradient(60% 60% at 50% 30%, oklch(0.93 0.04 275 / 0.7), transparent 70%)`,
      reelList: D.P.map(p => ({ sym: p.sym, icon: C.PICON[p.id] || 'layers', soft: `oklch(0.94 0.045 ${p.hue})`, ink: `oklch(0.48 0.16 ${p.hue})`, dot: `oklch(0.55 0.17 ${p.hue})`, name: p.name, meta: p.tests.length + ' tests · ' + cost(p), go: () => this.goReel(p.i), bg: p.i === ri ? '#EEECF8' : 'transparent', bd: p.i === ri ? '#D9D5F0' : 'transparent' })),
      mobileReels: s.reelsOpen && isMobile, desktopReels: s.reelsOpen && isDesktop, reelDots: D.P.map(p => ({ h: p.i === ri ? '26px' : '8px', bg: p.i === ri ? '#3B2C9E' : '#D4D1E6', go: () => this.goReel(p.i) })), reelUp: () => this.goReel(this.cur() - 1), reelDown: () => this.goReel(this.cur() + 1), reelPos: (ri + 1) + ' / ' + n,
      prevSlide: () => { const i = this.cur(); this.goSlide(i, (this.state.slides[i] || 0) - 1); }, nextSlide: () => { const i = this.cur(); this.goSlide(i, (this.state.slides[i] || 0) + 1); },
      reelPadB, barPad, tabBottom: 'calc(10px + ' + barPad + ')', testsBarBottom: 'calc(86px + ' + barPad + ')', cartPadB: 'calc(12px + ' + barPad + ')', slidePadB: 'calc(134px + ' + reelPadB + ')', railBottom: 'calc(152px + ' + reelPadB + ')', hintBottom: 'calc(82px + ' + reelPadB + ')'
    };
  }
