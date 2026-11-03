  componentDidMount() {
    this._onResize = () => { const w = window.innerWidth, hh = Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight); if (w !== this.state.w || Math.abs(hh - this.state.h) > 80) this.setState({ w, h: hh }); this.syncBars(); };
    window.addEventListener('resize', this._onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', this._onResize);
    this._onResize();
    let saved = null; try { saved = JSON.parse(localStorage.getItem('avmlabs_region_v1') || 'null'); } catch (e) {}
    this.loadCatalog();
    if (saved && Component.REGIONS[saved.code]) this.setState({ region: saved, geo: 'ok' });
    else if (this.gateOn()) this.locate();
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
      const h = this.fromHash();
      this._reelPushed = false;
      this.setState({ locOpen: false, qFocus: false, ...h });
      if (h.reelsOpen) { this._ri = h.reelIdx; this.armHint(); } else { clearTimeout(this._ht); clearTimeout(this._ht2); window.scrollTo(0, 0); }
    };
    window.addEventListener('popstate', this._onPop);
    this._tickT = setInterval(() => { if (!this.state.reelsOpen && this.state.page === 'home') this.setState(s => ({ tick: (s.tick || 0) + 1 })); }, 2200);
    this._heroT = setInterval(() => { if (this.state.page === 'home' && !this.state.reelsOpen) this.setState(s => ({ hero: (s.hero + 1) % 3 })); }, 6000);
    if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) this.typeLoop();
    requestAnimationFrame(() => this.fillSlots());
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
  componentDidUpdate() {
    this.syncBars();
    this.fillSlots();
    const open = !!this.state.reelsOpen;
    if (this._wasOpen !== open) {
      this._wasOpen = open;
      document.body.style.overflow = open ? 'hidden' : '';
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (!open && this._wheelEl) { const w = this._wheelEl; w.removeEventListener('wheel', this._onWheel); w.removeEventListener('touchstart', this._ts); w.removeEventListener('touchmove', this._tm); w.removeEventListener('touchend', this._te); w.removeEventListener('touchcancel', this._te); this._wheelEl = null; }
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
              if (this._wheelEl) { const w = this._wheelEl; w.removeEventListener('wheel', this._onWheel); w.removeEventListener('touchstart', this._ts); w.removeEventListener('touchmove', this._tm); w.removeEventListener('touchend', this._te); w.removeEventListener('touchcancel', this._te); }
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
              const canScrollY = (t) => { while (t && t !== el) { if (t.scrollHeight > t.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(t).overflowY)) return true; t = t.parentElement; } return false; };
              this._ts = ev => { this.armHint(); if (ev.touches.length !== 1) { this._drag = null; return; } const p = ev.touches[0]; this._drag = { x: p.clientX, y: p.clientY, t: Date.now(), axis: null, skip: canScrollY(ev.target), dy: 0, moved: false, target: ev.target }; };
              this._tm = ev => {
                const d = this._drag; if (!d) return;
                const p = ev.touches[0], dx = p.clientX - d.x, dy = p.clientY - d.y;
                if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.moved = true; // not a tap (also inside scrolling lists)
                if (d.skip) return;
                if (!d.axis) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; d.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'; }
                if (d.axis !== 'y') return;
                ev.preventDefault();
                const i = this.cur(), last = Component.PROFILES.length - 1, H = el.clientHeight;
                const off = (i === 0 && dy > 0) || (i === last && dy < 0) ? dy * 0.3 : dy;
                d.dy = dy;
                this.applyTrack(i, false, -i * H + off);
              };
              this._te = () => {
                const d = this._drag; this._drag = null; if (!d) return;
                if (!d.moved && Date.now() - d.t < 300) { this.reelTap(d, el); return; }
                if (d.axis !== 'y') return;
                const H = el.clientHeight, v = d.dy / Math.max(1, Date.now() - d.t);
                const step = (d.dy < -H * 0.16 || v < -0.4) ? 1 : (d.dy > H * 0.16 || v > 0.4) ? -1 : 0;
                this.goReel(this.cur() + step);
              };
              el.addEventListener('touchstart', this._ts, { passive: true });
              el.addEventListener('touchmove', this._tm, { passive: false });
              el.addEventListener('touchend', this._te);
              el.addEventListener('touchcancel', this._te);
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
  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize); window.removeEventListener('keydown', this._onKey); window.removeEventListener('scroll', this._onScroll); window.removeEventListener('popstate', this._onPop);
    document.removeEventListener('focusin', this._onFocusIn); document.removeEventListener('focusout', this._onFocusOut);
    if (window.visualViewport) { window.visualViewport.removeEventListener('resize', this._onResize); window.visualViewport.removeEventListener('resize', this._onVV); window.visualViewport.removeEventListener('scroll', this._onVV); }
    clearInterval(this._heroT); clearInterval(this._tickT); cancelAnimationFrame(this._cRaf);
    [this._tt, this._ht, this._ht2, this._gT, this._vT, this._hT, this._tyT].forEach(clearTimeout);
    document.body.style.overflow = ''; document.documentElement.style.overflow = '';
  }

