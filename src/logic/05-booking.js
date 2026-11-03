  days() {
    const out = [], d0 = new Date(); d0.setHours(0, 0, 0, 0);
    for (let i = 0; i < 6; i++) {
      const d = new Date(d0); d.setDate(d0.getDate() + i);
      const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      out.push({ key, i, top: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' }), bottom: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), num: d.getDate(), mon: d.toLocaleDateString('en-GB', { month: 'short' }), full: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) });
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

  // Message for a quick "Book now" (cards, reels, test page, footer): what is being booked with price and prep,
  // where, and any patient details already typed into the cart form.
  bookWA(items) {
    const D = this.db(), RG = this.region(), s = this.state, f = s.form;
    const list = items.map(c => ({ c, x: c.type === 'profile' ? D.PM[c.id] : D.T[c.id] })).filter(i => i.x);
    if (!list.length) return;
    const many = list.length > 1, lines = ['Hi AVM Labs! I would like to book:', ''];
    let total = 0, fasting = false, tat = '';
    list.forEach(({ c, x }, i) => {
      total += this.pr(x); fasting = fasting || !!x.fasting;
      if (this.tatHrs(this.tat(x)) > this.tatHrs(tat)) tat = this.tat(x);
      lines.push((many ? (i + 1) + '. ' : '') + '*' + x.name + '*' + (c.type === 'profile' ? ' (Health profile)' : ' (Lab test)'));
      if (c.type === 'profile') lines.push('   Includes ' + x.ts.length + ' tests: ' + x.ts.map(t => t.short).join(', '));
      else lines.push('   ' + x.params + ' parameter' + (x.params > 1 ? 's' : ''));
      lines.push('   Price: ' + this.cost(x));
    });
    if (many) lines.push('', '*Total:* ' + this.money(total));
    lines.push('', '*Reports:* within ' + (tat || '24 hrs'), '*Preparation:* ' + (fasting ? '10–12 hrs fasting needed' : 'No fasting needed'),
      '*Location:* ' + ((s.region && s.region.city ? s.region.city + ', ' : '') + RG.name),
      '*Collection:* ' + (s.mode === 'walkin' ? 'Walk-in at centre' : 'Home sample collection'));
    if (f.name.trim()) lines.push('*Patient:* ' + [f.name.trim(), f.age, f.gender].filter(Boolean).join(', '));
    if (RG.phRe.test(f.phone)) lines.push('*Mobile:* ' + RG.dial + ' ' + f.phone);
    lines.push('', 'Please share the available slots. Thank you!');
    this.openWA(lines.join('\n'));
  }

  confirm() {
    const b = this.bill(); if (!b.items.length) return;
    const e = this.validate();
    if (Object.keys(e).length) { this.setState({ errors: e }); this.flash('Please complete the highlighted details'); return; }
    const f = this.state.form;
    const day = (this.days().find(d => d.key === f.date) || {}).full || '';
    const lines = ['Hi AVM Labs! I would like to book:', '', ...b.items.map((it, i) => (i + 1) + '. ' + it.name + ' – ' + this.money(it.price)), '',
      this.state.mode === 'home' ? '*Collection:* Home sample collection (Free)' : '*Collection:* Walk-in at centre',
      '*Date & slot:* ' + day + ' · ' + f.slot,
      '*Patient:* ' + f.name.trim() + ', ' + f.age + ', ' + f.gender,
      '*Mobile:* ' + this.region().dial + ' ' + f.phone];
    if (f.nid) lines.push('*' + this.region().idLabel + ':* ' + f.nid);
    if (this.state.mode === 'home') lines.push('*Address:* ' + f.address.trim());
    lines.push('', 'Item total: ' + this.money(b.price));
    lines.push('*To pay: ' + this.money(b.pay) + '*');
    const url = this.wa(lines.join('\n'));
    this.setState({ booked: { url } });
    this.openWA(url, true);
  }

