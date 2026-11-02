  componentDidMount() {
    this._onResize = () => { const w = window.innerWidth, hh = Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight); if (w !== this.state.w || Math.abs(hh - this.state.h) > 80) this.setState({ w, h: hh }); };
    window.addEventListener('resize', this._onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', this._onResize);
    this._onResize();
    let saved = null; try { saved = JSON.parse(localStorage.getItem('avmlabs_region_v1') || 'null'); } catch (e) {}
    this.loadProfiles();
    if (saved && Component.REGIONS[saved.code]) this.setState({ region: saved, geo: 'ok' });
    else if (this.gateOn()) this.locate();
    this._onKey = e => {
      if (!this.state.reelsOpen) return;
      const i = this.cur(), k = this.state.slides[i] || 0;
      if (e.key === 'ArrowDown') { e.preventDefault(); this.goReel(i + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.goReel(i - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.goSlide(i, k + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.goSlide(i, k - 1); }
      else if (e.key === 'Escape') this.closeReels();
    };
    window.addEventListener('keydown', this._onKey);
    this._onScroll = () => { const scrolled = window.scrollY > 240; if (scrolled !== !!this.state.scrolled) this.setState({ scrolled }); };
    window.addEventListener('scroll', this._onScroll, { passive: true });
    this._tickT = setInterval(() => { if (!this.state.reelsOpen && this.state.page === 'home') this.setState(s => ({ tick: (s.tick || 0) + 1 })); }, 2200);
    this._heroT = setInterval(() => { if (this.state.page === 'home' && !this.state.reelsOpen) this.setState(s => ({ hero: (s.hero + 1) % 3 })); }, 6000);
    if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) this.typeLoop();
    requestAnimationFrame(() => this.fillSlots());
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
    if (!els.length) { this._tyT = setTimeout(() => this.typeLoop(), 500); return; }
    const terms = Component.TYPE_TERMS[mode], word = terms[t.i % terms.length];
    let wait;
    if (!t.del) { t.n++; if (t.n >= word.length) { t.n = word.length; t.del = true; wait = 1700; } else wait = 75 + Math.random() * 55; }
    else { t.n--; if (t.n <= 0) { t.n = 0; t.del = false; t.i++; wait = 380; } else wait = 38; }
    els.forEach(el => { const ov = el.nextElementSibling, w = ov && ov.querySelector('[data-type-word]'); if (w) { el.setAttribute('data-typing', '1'); ov.style.display = 'flex'; w.textContent = word.slice(0, t.n); } });
    this._tyT = setTimeout(() => this.typeLoop(), wait);
  }
  componentDidUpdate() {
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
              this._ts = ev => { if (ev.touches.length !== 1) { this._drag = null; return; } const p = ev.touches[0]; this._drag = { x: p.clientX, y: p.clientY, t: Date.now(), axis: null, skip: canScrollY(ev.target), dy: 0 }; };
              this._tm = ev => {
                const d = this._drag; if (!d || d.skip) return;
                const p = ev.touches[0], dx = p.clientX - d.x, dy = p.clientY - d.y;
                if (!d.axis) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; d.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'; }
                if (d.axis !== 'y') return;
                ev.preventDefault();
                const i = this.cur(), last = Component.PROFILES.length - 1, H = el.clientHeight;
                const off = (i === 0 && dy > 0) || (i === last && dy < 0) ? dy * 0.3 : dy;
                d.dy = dy;
                this.applyTrack(i, false, -i * H + off);
              };
              this._te = () => {
                const d = this._drag; this._drag = null; if (!d || d.axis !== 'y') return;
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
    window.removeEventListener('resize', this._onResize); window.removeEventListener('keydown', this._onKey); window.removeEventListener('scroll', this._onScroll);
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', this._onResize);
    clearInterval(this._heroT); clearInterval(this._tickT);
    [this._tt, this._ht, this._ht2, this._gT, this._vT, this._hT, this._tyT].forEach(clearTimeout);
    document.body.style.overflow = ''; document.documentElement.style.overflow = '';
  }

