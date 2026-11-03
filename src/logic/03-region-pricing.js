  static REGIONS = {
    BH: { code: 'BH', name: 'Bahrain', dial: '+973', phLen: 8, phRe: /^[36]\d{7}$/, phPh: '8-digit mobile', idLabel: 'CPR number', idLen: 9, idRe: /^\d{9}$/, idPh: '9-digit CPR', show: v => 'BD ' + Number(v.toFixed(3)), postLabel: 'Block number', postPh: 'Block no. (e.g. 338)', postRe: /^\d{3,4}$/, postMax: 4, waProp: 'whatsappNumberBahrain', waDef: '97300000000', addrProp: 'addressBahrain', addrDef: '[Bahrain centre address]' },
    SA: { code: 'SA', name: 'Saudi Arabia', dial: '+966', phLen: 9, phRe: /^5\d{8}$/, phPh: '5X XXX XXXX', idLabel: 'National ID / Iqama', idLen: 10, idRe: /^[12]\d{9}$/, idPh: '10-digit ID or Iqama', show: v => 'SAR ' + Number(v.toFixed(2)).toLocaleString('en-US'), postLabel: 'Postal code', postPh: '5-digit postal code', postRe: /^\d{5}$/, postMax: 5, waProp: 'whatsappNumberKSA', waDef: '966500000000', addrProp: 'addressKSA', addrDef: '[KSA centre address]' },
    AE: { code: 'AE', name: 'UAE', dial: '+971', phLen: 9, phRe: /^5\d{8}$/, phPh: '5X XXX XXXX', idLabel: 'Emirates ID', idLen: 15, idRe: /^784\d{12}$/, idPh: '784-XXXX-XXXXXXX-X', show: v => 'AED ' + Number(v.toFixed(2)).toLocaleString('en-US'), postLabel: 'Area', postPh: 'Area (e.g. Al Barsha)', postRe: /\S{2,}/, postMax: 40, text: true, waProp: 'whatsappNumberUAE', waDef: '971500000000', addrProp: 'addressUAE', addrDef: '[UAE centre address]' }
  };
  region() {
    const p = this.props || {}, R = Component.REGIONS;
    if (p.previewRegion && R[p.previewRegion]) return R[p.previewRegion];
    const r = this.state.region; return (r && R[r.code]) || R.BH;
  }
  // Tests and profiles carry a price and report time per country (prices: { AE, SA, BH }, tats: { … }).
  // pr() is the price in the visitor's country, money() formats a local amount, cost() does both.
  pr(x) { const v = x && x.prices && x.prices[this.region().code]; return v > 0 ? v : 0; }
  money(v) { return this.region().show(Math.max(0, v || 0)); }
  cost(x) { return this.money(this.pr(x)); }
  sumPr(list) { return list.reduce((a, x) => a + this.pr(x), 0); }
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
