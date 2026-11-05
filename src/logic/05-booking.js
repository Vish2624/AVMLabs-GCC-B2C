  validate() {
    const f = this.state.form, e = {};
    if (f.name.trim().length < 2) e.name = "Enter the patient's full name";
    const rule = this.phoneRule();
    if (!rule.ok(f.phone)) e.phone = rule.err;
    const a = +f.age; if (!a || a < 1 || a > 110) e.age = 'Enter age';
    if (!f.gender) e.gender = 'Select gender';
    return e;
  }

  // Message for a quick "Book now" (cards, reels, test page, footer): what is being booked with price and prep,
  // where, and any patient details already typed into the cart form. num: a centre's WhatsApp (default: the visitor's).
  bookWA(items, num) {
    const D = this.db(), RG = this.region(), s = this.state, f = s.form;
    const list = items.map(c => ({ c, x: c.type === 'profile' ? D.PM[c.id] : D.T[c.id] })).filter(i => i.x);
    if (!list.length) return;
    const many = list.length > 1, lines = ['Hi AVM Labs! I would like to book:', ''];
    let total = 0, fasting = false, tat = '';
    list.forEach(({ c, x }, i) => {
      total += this.pr(x); fasting = fasting || !!x.fasting;
      if (this.tatHrs(this.tat(x)) > this.tatHrs(tat)) tat = this.tat(x);
      lines.push((many ? (i + 1) + '. ' : '') + '*' + x.name + '*' + (c.type === 'profile' ? ' (Health profile)' : ' (Lab test)'));
      lines.push('   ' + x.params + ' parameter' + (x.params > 1 ? 's' : ''));
      if (c.type === 'profile') lines.push('   Includes: ' + x.ts.map(t => t.short).join(', '));
      lines.push('   Price: ' + this.cost(x));
    });
    const pay = this.billed(total), topped = pay - total > 0.0001;
    if (many || topped) lines.push('');
    if (many) lines.push('*Total:* ' + this.money(total));
    if (topped) lines.push('*To pay:* ' + this.money(pay) + ' (minimum billing)');
    lines.push('', '*Reports:* within ' + (tat || '24 hrs'), '*Preparation:* ' + (fasting ? '10–12 hrs fasting needed' : 'No fasting needed'),
      '*Location:* ' + ((s.region && s.region.city ? s.region.city + ', ' : '') + RG.name),
      '*Collection:* ' + (s.mode === 'walkin' ? 'Walk-in at centre' : 'Home sample collection' + (total >= RG.hcFree ? ' (Free)' : ' (extra charges apply)')));
    if (f.name.trim()) lines.push('*Patient:* ' + [f.name.trim(), f.age, f.gender].filter(Boolean).join(', '));
    const rule = this.phoneRule();
    if (rule.ok(f.phone)) lines.push('*Mobile:* ' + rule.dial + ' ' + f.phone);
    lines.push('', 'Please share the available slots. Thank you!');
    this.openWA(lines.join('\n'), false, num);
  }

  confirm() {
    const b = this.bill(); if (!b.items.length) return;
    const e = this.validate();
    if (Object.keys(e).length) {
      this.setState({ errors: e }); this.flash('Please complete the highlighted details');
      // On phones the form is below the fold: bring the first message into view.
      setTimeout(() => { const el = document.querySelector('[data-err]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
      return;
    }
    const f = this.state.form;
    const lines = ['Hi AVM Labs! I would like to book:', '', ...b.items.map((it, i) => (i + 1) + '. ' + it.name + ' – ' + this.money(it.price)), '',
      this.state.mode === 'home' ? '*Collection:* Home sample collection' + (b.hcFree ? ' (Free)' : ' (extra charges apply)') : '*Collection:* Walk-in at centre',
      '*Patient:* ' + f.name.trim() + ', ' + f.age + ', ' + f.gender,
      '*Mobile:* ' + this.phoneRule().dial + ' ' + f.phone];
    lines.push('', 'Item total: ' + this.money(b.price));
    if (b.top > 0) lines.push('Minimum billing adjustment: ' + this.money(b.top));
    lines.push('*To pay: ' + this.money(b.pay) + '*', '', 'Please share the available slots. Thank you!');
    const url = this.wa(lines.join('\n'));
    this.setState({ booked: { url } });
    this.openWA(url, true);
  }

