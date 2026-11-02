  openReels(i) {
    this._openAt = Date.now();
    this._ri = i || 0;
    this.setState({ reelsOpen: true, reelIdx: i || 0, slides: {}, hint: false, locOpen: false });
    clearTimeout(this._ht); clearTimeout(this._ht2);
    
  }
  closeReels() { clearTimeout(this._ht); clearTimeout(this._ht2); this.setState({ reelsOpen: false, hint: false }); }
  scroller() { return (this.reelsRef && this.reelsRef.current) || document.querySelector('[data-reels-scroller]'); }
  cur() { return this._ri != null ? this._ri : this.state.reelIdx; }
  track() { const el = this.scroller(); return el && el.querySelector('[data-reel-track]'); }
  applyTrack(i, anim, px) {
    const t = this.track(); if (!t) return;
    t.style.transition = anim ? 'transform .45s cubic-bezier(.2,.85,.25,1)' : 'none';
    t.style.transform = px == null ? 'translate3d(0,' + (-i * 100) + '%,0)' : 'translate3d(0,' + px + 'px,0)';
  }
  goReel(i) {
    const n = Component.PROFILES.length; i = Math.max(0, Math.min(n - 1, i));
    this._ri = i;
    this.applyTrack(i, true);
    // commit to state only after the slide finishes — re-rendering mid-animation causes stutter
    clearTimeout(this._gT);
    this._gT = setTimeout(() => { if (this.state.reelIdx !== this._ri) this.setState({ reelIdx: this._ri }); }, 480);
    return;
  }
  goSlide(i, k) {
    const el = this.scroller(); if (!el) return;
    const h = el.querySelectorAll('[data-h]')[i]; if (!h) return;
    k = Math.max(0, Math.min(2, k));
    h.scrollTo({ left: k * h.clientWidth, behavior: 'smooth' });
  }
  // Re-render only after the swipe settles — updating state mid-gesture re-renders every reel and causes stutter.
  onReelsScroll(e) {
    const el = e.currentTarget;
    clearTimeout(this._vT);
    this._vT = setTimeout(() => {
      const i = Math.round(el.scrollTop / el.clientHeight);
      if (i !== this.state.reelIdx) this.setState({ reelIdx: i });
    }, 120);
  }
  onH(i, e) {
    const el = e.currentTarget;
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
    const text = p.name + ' — ' + this.inr(p.price) + ' at AVM Labs';
    if (navigator.share) navigator.share({ title: p.name, text, url: location.href }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + location.href).then(() => this.flash('Link copied'), () => this.flash("Couldn't copy the link"));
    else this.flash("Couldn't copy the link");
  }

