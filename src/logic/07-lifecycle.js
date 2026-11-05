  componentDidMount() {
    this._onResize = () => { const w = window.innerWidth, hh = Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight); if (w !== this.state.w || Math.abs(hh - this.state.h) > 80) this.setState({ w, h: hh }); this.syncBars(); };
    window.addEventListener('resize', this._onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', this._onResize);
    this._onResize();
    let saved = null; try { saved = JSON.parse(localStorage.getItem('avmlabs_region_v1') || 'null'); } catch (e) {}
    this.loadCatalog();
    if (saved && Component.REGIONS[saved.code]) this.setState({ region: saved, geo: 'ok' });
    // Only look the visitor up straight away if they already allowed it; otherwise the gate's Allow button asks,
    // so the browser prompt follows a tap instead of appearing unasked on page load.
    else if (this.gateOn()) {
      const q = navigator.permissions && navigator.permissions.query ? navigator.permissions.query({ name: 'geolocation' }) : Promise.reject();
      q.then(p => { if (p.state === 'granted') this.locate(); }, () => {});
    }
    this._onKey = e => {
      if (!this.state.reelsOpen) return;
      this.armHint();
      const i = this.cur(), k = this.state.slides[i] || 0;
      if (e.key === 'ArrowDown') { e.preventDefault(); this.goReel(i + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.goReel(i - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.goSlide(i, k + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.goSlide(i, k - 1); }
      else if (e.key === 'Escape') this.closeReels();
    };
    window.addEventListener('keydown', this._onKey);
    this._onScroll = () => {
      const scrolled = window.scrollY > 240;
      if (scrolled !== !!this.state.scrolled) this.setState({ scrolled });
      this.fixBars();
      this.syncBars();
    };
    window.addEventListener('scroll', this._onScroll, { passive: true });
    // Phones: hide the bottom bars while typing (they would cover the form), and put them back
    // at the bottom once the keyboard closes; iOS Safari can leave fixed bars stranded mid-screen.
    const typing = el => el && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|range|color|file)$/.test(el.type)));
    this._onFocusIn = e => { if (typing(e.target) && this.state.w < 1024 && !this.state.kb) this.setState({ kb: true }); };
    this._onFocusOut = () => {
      setTimeout(() => {
        if (typing(document.activeElement)) return;
        if (this.state.kb) this.setState({ kb: false });
        window.scrollTo(window.scrollX, window.scrollY);
        this.fixBars();
      }, 60);
      setTimeout(() => this.fixBars(), 400);
    };
    document.addEventListener('focusin', this._onFocusIn);
    document.addEventListener('focusout', this._onFocusOut);
    this._onVV = () => this.fixBars();
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', this._onVV); window.visualViewport.addEventListener('scroll', this._onVV); }
    this._onPop = () => {
      this.fromOldHash();
      const h = this.fromUrl();
      this._reelPushed = false;
      this.setState({ locOpen: false, qFocus: false, ...h });
      if (h.reelsOpen) { this._ri = h.reelIdx; this.armHint(); } else { clearTimeout(this._ht); clearTimeout(this._ht2); window.scrollTo(0, 0); }
    };
    window.addEventListener('popstate', this._onPop);
    // Both timers re-render the page, so they only run while their section is on screen in a visible tab, on the
    // home page with no reel open. The hero doesn't auto-advance for reduced motion.
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const live = el => { if (!el || document.hidden || this.state.reelsOpen || this.state.page !== 'home') return false; const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
    this._tickT = setInterval(() => { if (live(document.querySelector('[data-centre-strip]')?.parentElement)) this.setState(s => ({ tick: (s.tick || 0) + 1 })); }, 2200);
    this._heroT = setInterval(() => { if (!still && live(document.querySelector('[data-hero-card]'))) this.setState(s => ({ hero: (s.hero + 1) % 4 })); }, 6000);
    if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) this.typeLoop();
    requestAnimationFrame(() => this.fillSlots());
    this.syncTitle();
    this.centreLoop();
    // Opened straight onto a reel (refresh or shared link).
    if (this.state.reelsOpen) { this._ri = this.state.reelIdx; this.armHint(); this.componentDidUpdate(); }
  }
  // Centres gallery: the tile passing the middle of the strip grows, then eases back to normal size as it moves on.
  centreLoop() {
    const step = () => {
      this._cRaf = requestAnimationFrame(step);
      // Paused under the reels: measuring the page every frame would make reel swipes stutter on phones.
      if (this.state.reelsOpen) return;
      const strip = document.querySelector('[data-centre-strip]'); if (!strip) return;
      const r = strip.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;
      const mid = r.left + r.width / 2;
      strip.querySelectorAll('[data-centre-tile]').forEach(el => {
        const b = el.getBoundingClientRect(), w = b.width / (parseFloat(el.dataset.s) || 1);
        const d = Math.min(1, Math.abs(b.left + b.width / 2 - mid) / (w + 44)), t = (1 + Math.cos(d * Math.PI)) / 2;
        const s = 1 + 0.24 * t;
        if (Math.abs(s - (parseFloat(el.dataset.s) || 1)) < 0.001) return;
        el.dataset.s = s;
        el.style.transform = 'translateZ(0) scale(' + s.toFixed(4) + ')';
        el.style.zIndex = t > 0.5 ? '2' : '';
        el.style.boxShadow = t > 0.01 ? '0 ' + (24 * t).toFixed(1) + 'px ' + (44 * t).toFixed(1) + 'px -' + (18 * t).toFixed(1) + 'px rgba(42,31,122,' + (0.45 * t).toFixed(3) + ')' : '';
      });
    };
    if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) this._cRaf = requestAnimationFrame(step);
  }
  // Templated image-slots get their attributes after they're created and can miss their first fill;
  // re-setting an observed attribute makes them render their photo.
  fillSlots() {
    document.querySelectorAll('image-slot:not([data-filled]):not([data-attribution-error])').forEach(el => el.setAttribute('placeholder', el.getAttribute('placeholder') || ''));
  }
  // Types search terms into the home search placeholder. Writes to the DOM directly so it never re-renders the page.
  typeLoop() {
    const els = document.querySelectorAll('[data-type-ph]');
    const mode = this.state.sMode === 'tests' ? 'tests' : 'profiles';
    const t = this._ty || (this._ty = { mode, i: 0, n: 0, del: false });
    if (t.mode !== mode) Object.assign(t, { mode, i: 0, n: 0, del: false });
    if (!els.length || this.state.reelsOpen) { this._tyT = setTimeout(() => this.typeLoop(), 500); return; }
    const terms = Component.TYPE_TERMS[mode], word = terms[t.i % terms.length];
    let wait;
    if (!t.del) { t.n++; if (t.n >= word.length) { t.n = word.length; t.del = true; wait = 1700; } else wait = 75 + Math.random() * 55; }
    else { t.n--; if (t.n <= 0) { t.n = 0; t.del = false; t.i++; wait = 380; } else wait = 38; }
    els.forEach(el => { const ov = el.nextElementSibling, w = ov && ov.querySelector('[data-type-word]'); if (w) { el.setAttribute('data-typing', '1'); ov.style.display = 'flex'; w.textContent = word.slice(0, t.n); } });
    this._tyT = setTimeout(() => this.typeLoop(), wait);
  }
  // If the visible area reaches below the layout viewport (the iOS bug above), shift the bottom bars down by the gap.
  // Normally the gap is 0, so this does nothing.
  fixBars() {
    const v = window.visualViewport; if (!v) return;
    const drop = this.state.kb ? 0 : Math.max(0, Math.round(v.offsetTop + v.height - window.innerHeight));
    if (drop !== this._drop) { this._drop = drop; document.documentElement.style.setProperty('--vv-drop', drop + 'px'); }
  }
  // Sticky bars sit right under the header (--hdr-h); the Tests page search/filter bar gets a shadow once it is stuck.
  syncBars() {
    const hd = document.querySelector('header'), h = hd ? hd.offsetHeight : 0;
    if (h && h !== this._hdrH) { this._hdrH = h; document.documentElement.style.setProperty('--hdr-h', h + 'px'); }
    const bar = document.querySelector('[data-tests-bar]');
    if (bar) { const stuck = bar.getBoundingClientRect().top <= h + 1 && window.scrollY > 0; if (stuck !== bar.hasAttribute('data-stuck')) bar.toggleAttribute('data-stuck', stuck); }
  }
  // Browser tab title, description and canonical link for the open page (or reel), so tabs, history, shared links
  // and search results read well. The home values and the site address come from the tags in index.html.
  syncTitle() {
    const s = this.state, D = this.db(), t = s.page === 'test' && D.T[s.testId], p = s.reelsOpen && this.reelList()[this.cur()];
    const tag = sel => document.querySelector(sel), canon = tag('link[rel="canonical"]'), desc = tag('meta[name="description"]');
    const home = this._seo || (this._seo = { site: canon ? new URL(canon.href).origin : location.origin, desc: desc ? desc.content : '', og: (tag('meta[property="og:description"]') || {}).content || '', robots: (tag('meta[name="robots"]') || {}).content || '' });
    const where = ' Home sample collection in Bahrain, Saudi Arabia and the UAE.';
    const name = p ? p.name + ': Health Checkup Tests & Price' : t ? t.name + ' Test: Price & Report Time' : { tests: 'All Lab Tests', profiles: 'Health Checkup Profiles', cart: 'Your Cart' }[s.page];
    const title = name ? name + ' | AVM Labs' : 'AVM Labs | Lab Tests & Health Profiles with Home Collection';
    const text = p ? p.name + ': ' + (p.tagline ? p.tagline + ' ' : '') + p.params + ' parameters from one sample' + (this.tat(p) ? ', report in ' + this.tat(p) : '') + '.' + where
      : t ? t.name + ' test at AVM Labs. ' + (((t.about || '').match(/^.*?\.(?=\s|$)/) || [t.about || ''])[0]) + (this.tat(t) ? ' Report in ' + this.tat(t) + ',' : '') + (t.fasting ? ' fasting needed.' : ' no fasting needed.') + where
      : { tests: 'Browse every lab test at AVM Labs with local prices, report times and fasting needs. Book online.' + where,
        profiles: 'Compare AVM Labs health checkup profiles: packages of tests taken from one sample, at one price.' + where,
        cart: 'Review the lab tests and health profiles in your AVM Labs cart and book a home sample collection.' }[s.page] || home.desc;
    const url = home.site + (p ? this.reelPath(this.cur()) : this.pagePath());
    const set = (sel, attr, v) => { const el = tag(sel); if (el && el.getAttribute(attr) !== v) el.setAttribute(attr, v); };
    if (document.title !== title) document.title = title;
    set('meta[name="description"]', 'content', text);
    set('link[rel="canonical"]', 'href', url);
    set('meta[property="og:url"]', 'content', url);
    set('meta[property="og:title"]', 'content', title);
    set('meta[property="og:description"]', 'content', name ? text : home.og);
    // The cart is personal: keep it out of search results.
    set('meta[name="robots"]', 'content', s.page === 'cart' && !p ? 'noindex, follow' : home.robots);
  }
  componentDidUpdate() {
    this.syncTitle();
    this.syncBars();
    this.fillSlots();
    this.pageIn();
    const open = !!this.state.reelsOpen;
    if (this._wasOpen !== open) {
      this._wasOpen = open;
      document.body.style.overflow = open ? 'hidden' : '';
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (!open && this._wheelEl) { const w = this._wheelEl; w.removeEventListener('wheel', this._onWheel); w.removeEventListener('touchstart', this._ts); w.removeEventListener('touchmove', this._tm); w.removeEventListener('touchend', this._te); w.removeEventListener('touchcancel', this._tc); w.removeEventListener('click', this._tap, true); this._wheelEl = null; }
      if (open) {
        const idx = this.state.reelIdx;
        let tries = 0;
        const tick = () => {
          const el = this.scroller();
          if (el && el.clientHeight) {
            this.applyTrack(idx, false);
            if (this._openSlide) {
              const h = el.querySelectorAll('[data-h]')[idx];
              if (h) h.scrollLeft = this._openSlide * h.clientWidth;
              this._openSlide = 0;
            }
            if (this._wheelEl !== el) {
              if (this._wheelEl) { const w = this._wheelEl; w.removeEventListener('wheel', this._onWheel); w.removeEventListener('touchstart', this._ts); w.removeEventListener('touchmove', this._tm); w.removeEventListener('touchend', this._te); w.removeEventListener('touchcancel', this._tc); w.removeEventListener('click', this._tap, true); }
              this._onWheel = ev => {
                if (Math.abs(ev.deltaY) < Math.abs(ev.deltaX)) return;
                let t = ev.target; while (t && t !== el) { if (t.scrollHeight > t.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(t).overflowY)) return; t = t.parentElement; }
                ev.preventDefault();
                const now = Date.now();
                if (now < (this._wheelLock || 0) || Math.abs(ev.deltaY) < 8) return;
                this._wheelLock = now + 650;
                this.goReel(this.cur() + (ev.deltaY > 0 ? 1 : -1));
              };
              el.addEventListener('wheel', this._onWheel, { passive: false });
              // The nearest list inside the reel that scrolls up and down (e.g. "What's included"), if any.
              const listOf = (t) => { while (t && t !== el) { if (t.scrollHeight > t.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(t).overflowY)) return t; t = t.parentElement; } return null; };
              this._ts = ev => {
                this.armHint();
                if (ev.touches.length !== 1) { this._drag = null; return; }
                // A touch during a glide catches the reel where it is, as on Instagram, instead of jumping.
                const p = ev.touches[0], caught = !!this._sprRaf, y0 = this.trackY();
                if (caught) this.applyTrack(0, false, y0);
                // Times come from the events (when the finger moved), not from when the handler ran, so a busy moment
                // on the phone doesn't distort the flick speed.
                this._drag = { x: p.clientX, y: p.clientY, t: Date.now(), y0, caught, axis: null, list: listOf(ev.target), moved: caught, target: ev.target, pts: [[ev.timeStamp, p.clientY]] };
              };
              this._tm = ev => {
                const d = this._drag; if (!d) return;
                const p = ev.touches[0], dx = p.clientX - d.x, dy = p.clientY - d.y;
                if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.moved = true; // not a tap (also inside scrolling lists)
                if (!d.axis) {
                  if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                  // A thumb swiping up curves sideways: anything steeper than ~40° counts as up/down, so the swipe
                  // isn't taken for a sideways one and lost to the slides.
                  d.axis = Math.abs(dy) >= Math.abs(dx) * 0.8 ? 'y' : 'x';
                  // In a list that can still scroll this way, the list scrolls; at its top or bottom the swipe moves the reels.
                  const L = d.list;
                  if (d.axis === 'y' && L && (dy < 0 ? L.scrollTop + L.clientHeight < L.scrollHeight - 1 : L.scrollTop > 0)) d.axis = 'list';
                }
                if (d.axis !== 'y') return;
                ev.preventDefault();
                const H = this.reelH(), min = -(this.reelList().length - 1) * H;
                // Past the first or last profile the track gives less and less, like a rubber band.
                const band = o => (1 - 1 / (o * 0.55 / H + 1)) * H;
                let y = d.y0 + dy;
                if (y > 0) y = band(y); else if (y < min) y = min - band(min - y);
                d.pts.push([ev.timeStamp, p.clientY]); if (d.pts.length > 8) d.pts.shift();
                this.applyTrack(0, false, y);
              };
              this._te = ev => {
                const d = this._drag; this._drag = null; if (!d) return;
                if (d.moved) this._noTapTill = Date.now() + 350;
                if (!d.moved && Date.now() - d.t < 300) { this.reelTap(d, el); return; }
                if (d.axis !== 'y') { if (d.caught) this.goReel(this.cur()); return; }
                // Release speed over the last ~100 ms of movement (px/ms), not the average of the whole drag, so a flick
                // at the end counts. A finger that stopped before letting go has no speed.
                const pts = d.pts, b = pts[pts.length - 1];
                let k = pts.findIndex(q => b[0] - q[0] <= 100); if (k === pts.length - 1) k--;
                const a = pts[k], v = a && b[0] > a[0] && ev.timeStamp - b[0] < 100 ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
                // pos: which reel the screen shows now, as a fraction (2.3 = 30% of the way from reel 2 to 3).
                // A flick needs some speed and some distance (a quick nudge under ~24px stays put); a slow drag switches past 15%.
                const i = this.cur(), pos = -this.trackY() / this.reelH(), far = Math.abs(b[1] - pts[0][1]) > 24;
                let to = far && v < -0.25 ? Math.floor(pos) + 1 : far && v > 0.25 ? Math.ceil(pos) - 1 : pos - i > 0.15 ? i + 1 : pos - i < -0.15 ? i - 1 : i;
                to = Math.max(i - 1, Math.min(i + 1, to));
                this.goReel(to, v);
              };
              // The browser took the touch over (a system gesture, a call): settle on the nearest reel, never a flick.
              this._tc = () => {
                const d = this._drag; this._drag = null; if (!d || (d.axis !== 'y' && !d.caught)) return;
                const i = this.cur(), to = Math.max(i - 1, Math.min(i + 1, Math.round(-this.trackY() / this.reelH())));
                this.goReel(to);
              };
              this._tap = ev => { if (Date.now() < (this._noTapTill || 0)) { ev.preventDefault(); ev.stopPropagation(); } };
              el.addEventListener('click', this._tap, true);
              el.addEventListener('touchstart', this._ts, { passive: true });
              el.addEventListener('touchmove', this._tm, { passive: false });
              el.addEventListener('touchend', this._te);
              el.addEventListener('touchcancel', this._tc);
              this._wheelEl = el;
            }
            return;
          }
          if (tries++ < 20) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }
  }
  // A new page (or another test) fades in, as one soft step instead of a hard cut. Opacity only: a transform here
  // would shift the sticky bars and anything fixed inside the page while it runs. Not on the first paint.
  pageIn() {
    const s = this.state, key = s.page + '/' + (s.page === 'test' ? s.testId : '');
    if (this._pageKey === key) return;
    const first = this._pageKey == null; this._pageKey = key;
    if (first || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const el = document.querySelector('[data-page]');
    if (el && el.animate) el.animate([{ opacity: 0.001 }, { opacity: 1 }], { duration: 240, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize); window.removeEventListener('keydown', this._onKey); window.removeEventListener('scroll', this._onScroll); window.removeEventListener('popstate', this._onPop);
    document.removeEventListener('focusin', this._onFocusIn); document.removeEventListener('focusout', this._onFocusOut);
    if (window.visualViewport) { window.visualViewport.removeEventListener('resize', this._onResize); window.visualViewport.removeEventListener('resize', this._onVV); window.visualViewport.removeEventListener('scroll', this._onVV); }
    clearInterval(this._heroT); clearInterval(this._tickT); cancelAnimationFrame(this._cRaf); cancelAnimationFrame(this._sprRaf);
    [this._tt, this._ht, this._ht2, this._gT, this._hT, this._tyT].forEach(clearTimeout);
    document.body.style.overflow = ''; document.documentElement.style.overflow = '';
  }

