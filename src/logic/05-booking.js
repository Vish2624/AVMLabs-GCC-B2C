  days() {
    const out = [], d0 = new Date(); d0.setHours(0, 0, 0, 0);
    for (let i = 0; i < 6; i++) {
      const d = new Date(d0); d.setDate(d0.getDate() + i);
      const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      out.push({ key, i, top: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }), bottom: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), num: d.getDate(), mon: d.toLocaleDateString('en-IN', { month: 'short' }), full: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) });
    }
    return out;
  }

  validate() {
    const f = this.state.form, e = {};
    if (f.name.trim().length < 2) e.name = "Enter the patient's full name";
    const RG = this.region();
    if (!RG.phRe.test(f.phone)) e.phone = 'Enter a valid ' + RG.phLen + '-digit mobile number';
    if (f.nid ? !RG.idRe.test(f.nid) : !RG.idOpt) e.nid = 'Enter a valid ' + RG.idLabel;
    const a = +f.age; if (!a || a < 1 || a > 110) e.age = 'Enter age';
    if (!f.gender) e.gender = 'Select gender';
    if (!f.date) e.date = 'Pick a date';
    if (!f.slot) e.slot = 'Pick a time slot';
    else if (f.date === (this.days()[0] || {}).key) {
      const sl = Component.SLOTS.find(x => x[0] === f.slot);
      if (sl && sl[1] <= new Date().getHours()) e.slot = 'That slot has passed — pick another';
    }
    if (this.state.mode === 'home' && f.address.trim().length < 8) e.address = 'Enter the collection address';
    return e;
  }

  confirm() {
    const b = this.bill(); if (!b.items.length) return;
    const e = this.validate();
    if (Object.keys(e).length) { this.setState({ errors: e }); this.flash('Please complete the highlighted details'); return; }
    const f = this.state.form, inr = x => this.inr(x), o = this.opts();
    const day = (this.days().find(d => d.key === f.date) || {}).full || '';
    const lines = ['Hi AVM Labs! I would like to book:', '', ...b.items.map((it, i) => (i + 1) + '. ' + it.name + ' – ' + this.money(it.price)), '',
      this.state.mode === 'home' ? '*Collection:* Home sample collection' + (b.hc ? ' (' + this.money(b.hc) + ')' : ' (Free)') : '*Collection:* Walk-in at centre',
      '*Date & slot:* ' + day + ' · ' + f.slot,
      '*Patient:* ' + f.name.trim() + ', ' + f.age + ', ' + f.gender,
      '*Mobile:* ' + this.region().dial + ' ' + f.phone];
    if (f.nid) lines.push('*' + this.region().idLabel + ':* ' + f.nid);
    if (this.state.mode === 'home') lines.push('*Address:* ' + f.address.trim());
    lines.push('', 'Item total: ' + this.money(b.price));
    lines.push('*To pay: ' + this.money(b.pay) + '*');
    const url = this.wa(lines.join('\n'));
    this.setState({ booked: { url } });
    window.open(url, '_blank', 'noopener');
  }

