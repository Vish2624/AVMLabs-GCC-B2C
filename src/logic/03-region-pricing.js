  static REGIONS = {
    BH: { code: 'BH', name: 'Bahrain', dial: '+973', phLen: 8, phRe: /^[36]\d{7}$/, phPh: '8-digit mobile', minBill: 1.5, hcFree: 18, show: v => Number(v.toFixed(3)) + ' BD' },
    SA: { code: 'SA', name: 'Saudi Arabia', dial: '+966', phLen: 9, phRe: /^5\d{8}$/, phPh: '5X XXX XXXX', minBill: 15, hcFree: 180, show: v => Number(v.toFixed(2)).toLocaleString('en-US') + ' SAR' },
    AE: { code: 'AE', name: 'UAE', dial: '+971', phLen: 9, phRe: /^5\d{8}$/, phPh: '5X XXX XXXX', minBill: 15, hcFree: 180, show: v => Number(v.toFixed(2)).toLocaleString('en-US') + ' AED' }
  };
  region() {
    const p = this.props || {}, R = Component.REGIONS;
    if (p.previewRegion && R[p.previewRegion]) return R[p.previewRegion];
    const r = this.state.region; return (r && R[r.code]) || R.BH;
  }
  // The visitor's country's centres (CENTRES), and the one they're sent to: the centre in their city, else the first listed.
  centres() { const code = this.region().code; return Component.CENTRES.filter(c => c.country === code); }
  centre() {
    const list = this.centres(), r = this.state.region, norm = v => String(v || '').toLowerCase().replace(/\bal[\s-]+/g, '').replace(/[^a-z]/g, '');
    const city = norm(r && r.city);
    return (city && list.find(c => { const n = norm(c.city); return n && (city.includes(n) || n.includes(city)); })) || list[0] || null;
  }
  // Tests and profiles carry a price and report time per country (prices: { AE, SA, BH }, tats: { … }).
  // pr() is the price in the visitor's country, money() formats a local amount (number first: '17 SAR'), cost() does both.
  pr(x) { const v = x && x.prices && x.prices[this.region().code]; return v > 0 ? v : 0; }
  money(v) { return this.region().show(Math.max(0, v || 0)); }
  cost(x) { return this.money(this.pr(x)); }
  // A local amount with the number and currency apart, to show the number large and the currency small after it,
  // as on every price: { num: '17', cur: 'SAR' }.
  priceParts(v) { const t = this.money(v), i = t.lastIndexOf(' '); return { num: t.slice(0, i), cur: t.slice(i + 1) }; }
  sumPr(list) { return list.reduce((a, x) => a + this.pr(x), 0); }
  // Minimum patient billing: a patient's whole bill is never less than the country's minimum (REGIONS minBill).
  // billed() is what a patient pays for a given item total, rounded so BD decimals compare exactly.
  billed(total) { const t = Math.round(total * 1000) / 1000; return t > 0 ? Math.max(t, this.region().minBill) : 0; }
  // Home collection is free when the items come to the country's limit or more (REGIONS hcFree); below it extra
  // charges apply, quoted by the team (no fixed amount). hcOn(x): a test or profile that reaches the limit on its own.
  hcOn(x) { return this.pr(x) >= this.region().hcFree; }
  minBillNote() { return 'Min. billing ' + this.money(this.region().minBill) + ' · add tests to avoid it'; }
  // Report time in the visitor's country, e.g. '24 hrs' or '2 days'; tatHrs() turns one into hours to compare.
  tat(x) { return (x && x.tats && x.tats[this.region().code]) || ''; }
  tatHrs(t) { const m = /(\d+(?:\.\d+)?)\s*(h|d)/i.exec(t || ''); return m ? +m[1] * (m[2].toLowerCase() === 'd' ? 24 : 1) : 0; }
  gateOn() { const p = this.props || {}; return p.requireLocation !== false && !(p.previewRegion && Component.REGIONS[p.previewRegion]); }
  pickRegion(code) {
    const region = { code, city: '', post: '', manual: true, ts: Date.now() };
    try { localStorage.setItem('avmlabs_region_v1', JSON.stringify(region)); } catch (e) {}
    this.setState({ region, geo: 'ok', pickCountry: false });
  }
  locate() {
    if (!navigator.geolocation) { this.setState({ geo: 'unsupported' }); return; }
    this.setState({ geo: 'locating' });
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: la, longitude: lo } = pos.coords;
      let code = '', country = '', city = '', post = '';
      try {
        const r = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + la + '&longitude=' + lo + '&localityLanguage=en');
        const j = await r.json(); code = (j.countryCode || '').toUpperCase(); country = j.countryName || ''; city = j.city || j.locality || j.principalSubdivision || ''; post = j.postcode || '';
      } catch (e) {
        if (la > 25.5 && la < 26.4 && lo > 50.3 && lo < 50.9) { code = 'BH'; country = 'Bahrain'; }
        else if (la > 22.6 && la < 26.3 && lo > 51.5 && lo < 56.5) { code = 'AE'; country = 'UAE'; }
        else if (la > 16 && la < 32.2 && lo > 34.5 && lo < 55.7) { code = 'SA'; country = 'Saudi Arabia'; }
      }
      if (Component.REGIONS[code]) {
        const region = { code, city, post, ts: Date.now() };
        try { localStorage.setItem('avmlabs_region_v1', JSON.stringify(region)); } catch (e) {}
        this.setState({ region, geo: 'ok' });
      } else this.setState({ geo: 'outside', geoCountry: country || 'your country' });
    }, err => this.setState({ geo: err && err.code === 1 ? 'denied' : 'error' }), { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
  }
