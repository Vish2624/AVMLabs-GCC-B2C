  // slide: 0 = overview, 1 = What's included, 2 = Good to know (phones; desktop shows all of it at once).
  openReels(i, slide) {
    this._ri = i || 0;
    this._openSlide = slide || 0;
    this.setState({ reelsOpen: true, reelIdx: i || 0, slides: {}, locOpen: false });
    this.setPath(this.reelPath(i || 0), this.pagePath());
    this._reelPushed = true;
    this._hc = 0;
    this.armHint();
  }
  closeReels() {
    clearTimeout(this._ht); clearTimeout(this._ht2); cancelAnimationFrame(this._sprRaf); this._sprRaf = 0; this.setState({ reelsOpen: false });
    // Step back over the entry openReels() added, so Back afterwards doesn't land on the same page again.
    if (this._reelPushed) { this._reelPushed = false; history.back(); } else this.replacePath(this.pagePath());
  }
  // Mobile reels: after 4s without any touch, show a swipe hint above the side buttons for 5s, then start counting again.
  // Alternates between "swipe left" (test details) and "swipe up/down" (other profiles).
  armHint() {
    clearTimeout(this._ht); clearTimeout(this._ht2);
    this.showHint(null);
    this._ht = setTimeout(() => {
      if (!this.state.reelsOpen || this.state.w >= 1024) return;
      const i = this.cur(), k = this.state.slides[i] || 0, n = Component.PROFILES.length, opts = [];
      if (k < 2) opts.push('left');
      if (n > 1) opts.push(i < n - 1 ? 'up' : 'down');
      if (!opts.length) return;
      this.showHint(opts[(this._hc = (this._hc || 0) + 1) % opts.length]);
      this._ht2 = setTimeout(() => { this.showHint(null); this.armHint(); }, 5000);
    }, 4000);
  }
  // Shows the hint on the current reel ('up', 'down', 'left'), or hides it (null). Written straight to the page:
  // a re-render here redraws every reel and stalled any swipe that started just as the hint came or went.
  showHint(dir) {
    const el = this.scroller(); if (!el) return;
    const cur = this.cur();
    el.querySelectorAll('[data-swipe-wrap]').forEach((w, k) => {
      if (!dir || k !== cur) { if (w.hasAttribute('data-on')) w.removeAttribute('data-on'); return; }
      w.querySelector('[data-swipe]').setAttribute('data-swipe', dir);
      w.querySelectorAll('avm-i').forEach(ic => ic.setAttribute('n', 'chevron-' + dir));
      w.querySelector('[data-swipe-label]').textContent = dir === 'left' ? 'details' : dir === 'down' ? 'back' : 'next';
      w.setAttribute('data-on', '');
    });
  }
  // Instagram-style double tap on a phone: a heart pops where the finger is, then floats up and fades.
  // Just for show: it doesn't like, add or change anything. Drawn straight into the page, no re-render.
  reelTap(d, host) {
    if (this.state.w >= 1024 || d.target.closest('button, a, input, select, textarea, details')) { this._lastTap = null; return; }
    const now = Date.now(), last = this._lastTap;
    this._lastTap = { t: now, x: d.x, y: d.y };
    if (!last || now - last.t > 320 || Math.hypot(d.x - last.x, d.y - last.y) > 60) return;
    // Further quick taps keep adding hearts, as on Instagram.
    const r = host.getBoundingClientRect(), h = document.createElement('span');
    h.setAttribute('data-dtap', '');
    h.style.left = Math.round(d.x - r.left) + 'px';
    h.style.top = Math.round(d.y - r.top) + 'px';
    h.style.setProperty('--tilt', (Math.random() * 40 - 20).toFixed(1) + 'deg');
    // A random gradient per heart, as on Instagram: red to amber, pink to purple or purple to pink.
    // [start colour, end colour, gradient end x, gradient end y, glow]
    const looks = [['#FF2400', '#FFA200', 0, 1, 'rgba(255,90,0,.4)'], ['#FF0A8C', '#A01EE0', 0, 1, 'rgba(225,20,170,.4)'], ['#A01EE0', '#FF0A8C', 1, 0.35, 'rgba(225,20,170,.4)']];
    const [c1, c2, gx, gy, glow] = looks[Math.floor(Math.random() * looks.length)], id = 'dtapG' + (this._dtapN = (this._dtapN || 0) + 1);
    h.style.setProperty('--glow', glow);
    // The stroke in the same gradient, with round joins, gives the plump shape and soft tip.
    h.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="' + gx + '" y2="' + gy + '"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><path fill="url(#' + id + ')" stroke="url(#' + id + ')" stroke-width="2" stroke-linejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
    h.addEventListener('animationend', () => h.remove());
    host.appendChild(h);
  }
  scroller() { return (this.reelsRef && this.reelsRef.current) || document.querySelector('[data-reels-scroller]'); }
  cur() { return this._ri != null ? this._ri : this.state.reelIdx; }
  track() { const el = this.scroller(); return el && el.querySelector('[data-reel-track]'); }
  // Where the track sits right now in px, read from the page so it is right even halfway through a glide.
  trackY() { const t = this.track(); return t ? new DOMMatrixReadOnly(getComputedStyle(t).transform).m42 : 0; }
  // One reel's height in px, with its fraction: many Android screens are e.g. 812.4px tall, and the rounded
  // clientHeight left the reel a few px off where it parks, so it jumped at the end of every glide.
  reelH() { const el = this.scroller(); return el ? el.getBoundingClientRect().height : 0; }
  // Paints only reels lo..hi (the one on screen and its neighbours). The others stay laid out but hidden, so the
  // phone isn't rasterising 8 full-screen photos while the track moves.
  cull(lo, hi) {
    const el = this.scroller(); if (!el) return;
    el.querySelectorAll('[data-reel]').forEach((r, k) => { const v = k >= lo && k <= hi ? '' : 'hidden'; if (r.style.visibility !== v) r.style.visibility = v; });
  }
  // Moves the reel track. px: follow the finger exactly. anim: glide to reel i on a spring that starts at the
  // finger's speed v0 (px/ms), so a flick carries straight on into the glide, as on Instagram. Otherwise jump to reel i.
  applyTrack(i, anim, px, v0) {
    const t = this.track(); if (!t) return;
    cancelAnimationFrame(this._sprRaf); this._sprRaf = 0;
    t.style.transition = 'none';
    if (px != null) { t.style.transform = 'translate3d(0,' + px + 'px,0)'; return; }
    // At rest the track is placed in %, so it stays aligned if the screen is resized or rotated.
    const park = () => { this._sprRaf = 0; t.style.transform = 'translate3d(0,' + (-i * 100) + '%,0)'; this.cull(i - 1, i + 1); };
    const H = this.reelH();
    if (!anim || !H || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { park(); return; }
    // Critically damped spring: no bounce past the reel, 90% of the way in ~0.16 s and 98% in ~0.25 s. Small fixed
    // steps keep it stable on a slow frame; positions are written straight to the page, no re-render.
    const end = -i * H, K = 600, C = 2 * Math.sqrt(K);
    let x = this.trackY(), v = (v0 || 0) * 1000, last = performance.now();
    const side = Math.sign(x - end), from = Math.round(-x / H);
    this.cull(Math.min(from, i) - 1, Math.max(from, i) + 1);
    const step = now => {
      let dt = Math.min(0.05, (now - last) / 1000); last = now;
      while (dt > 0) { const h = Math.min(dt, 1 / 240); v += (-K * (x - end) - C * v) * h; x += v * h; dt -= h; }
      // Done when it is within a pixel, or if a very hard flick would carry it past the reel: stop there, no bounce.
      if ((Math.abs(x - end) < 1 && Math.abs(v) < 40) || Math.sign(x - end) !== side) { park(); return; }
      t.style.transform = 'translate3d(0,' + x.toFixed(2) + 'px,0)';
      this._sprRaf = requestAnimationFrame(step);
    };
    this._sprRaf = requestAnimationFrame(step);
  }
  goReel(i, v0) {
    const n = Component.PROFILES.length; i = Math.max(0, Math.min(n - 1, i));
    this._ri = i;
    this.applyTrack(i, true, null, v0);
    this.replacePath(this.reelPath(i), this.pagePath());
    this.syncTitle();
    this.armHint();
    // commit to state only after the slide finishes — re-rendering mid-animation causes stutter
    clearTimeout(this._gT);
    // Desktop shows the current reel in its side list and counter, so it re-renders after the slide.
    // Phones show nothing that depends on it: skip the re-render, which redraws the whole page under the reels
    // and stalls the swipe for ~60-100 ms on mid-range phones. this._ri and the URL already track the reel.
    if (this.state.w >= 1024) this._gT = setTimeout(() => { if (this.state.reelIdx !== this._ri) this.setState({ reelIdx: this._ri }); }, 430);
    return;
  }
  goSlide(i, k) {
    const el = this.scroller(); if (!el) return;
    const h = el.querySelectorAll('[data-h]')[i]; if (!h) return;
    k = Math.max(0, Math.min(2, k));
    h.scrollTo({ left: k * h.clientWidth, behavior: 'smooth' });
  }
  onH(i, e) {
    const el = e.currentTarget;
    this.armHint();
    // fade the photo in step with the finger — no state, no re-render
    const p = Math.max(0, Math.min(1, el.scrollLeft / Math.max(1, el.clientWidth)));
    const reel = el.closest('[data-reel]');
    if (reel) {
      const im = reel.querySelector('[data-rimg]'), vl = reel.querySelector('[data-rveil]');
      if (im) im.style.opacity = String(1 - p * 0.75);
      if (vl) vl.style.opacity = String(p);
    }
    clearTimeout(this._hT);
    this._hT = setTimeout(() => {
      const k = Math.round(el.scrollLeft / el.clientWidth);
      if ((this.state.slides[i] || 0) !== k) this.setState(s => ({ slides: { ...s.slides, [i]: k } }));
    }, 120);
  }
  share(p) {
    const text = p.name + ' — ' + this.cost(p) + ' at AVM Labs';
    if (navigator.share) navigator.share({ title: p.name, text, url: location.href }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + location.href).then(() => this.flash('Link copied'), () => this.flash("Couldn't copy the link"));
    else this.flash("Couldn't copy the link");
  }

