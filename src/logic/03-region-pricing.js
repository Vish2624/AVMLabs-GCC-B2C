  static REGIONS = {
    IN: { code: 'IN', name: 'India', dial: '+91', phLen: 10, phRe: /^[6-9]\d{9}$/, phPh: '10-digit mobile', idLabel: 'Aadhaar number', idOpt: true, idLen: 12, idRe: /^\d{12}$/, idPh: '12-digit Aadhaar (optional)', rate: 1, step: 1, show: v => '₹' + Math.round(v).toLocaleString('en-IN'), postLabel: 'Pincode', postPh: '6-digit pincode', postRe: /^\d{6}$/, postMax: 6, waProp: 'whatsappNumber', waDef: '919999999999', addrProp: 'addressIndia', addrDef: '[India centre address]' },
    BH: { code: 'BH', name: 'Bahrain', dial: '+973', phLen: 8, phRe: /^[36]\d{7}$/, phPh: '8-digit mobile', idLabel: 'CPR number', idLen: 9, idRe: /^\d{9}$/, idPh: '9-digit CPR', rate: 0.0045, step: 0.5, show: v => 'BD ' + (Number.isInteger(v) ? v : v.toFixed(1)), postLabel: 'Block number', postPh: 'Block no. (e.g. 338)', postRe: /^\d{3,4}$/, postMax: 4, waProp: 'whatsappNumberBahrain', waDef: '97300000000', addrProp: 'addressBahrain', addrDef: '[Bahrain centre address]' },
    SA: { code: 'SA', name: 'Saudi Arabia', dial: '+966', phLen: 9, phRe: /^5\d{8}$/, phPh: '5X XXX XXXX', idLabel: 'National ID / Iqama', idLen: 10, idRe: /^[12]\d{9}$/, idPh: '10-digit ID or Iqama', rate: 0.045, step: 5, show: v => 'SAR ' + v.toLocaleString('en-US'), postLabel: 'Postal code', postPh: '5-digit postal code', postRe: /^\d{5}$/, postMax: 5, waProp: 'whatsappNumberKSA', waDef: '966500000000', addrProp: 'addressKSA', addrDef: '[KSA centre address]' },
    AE: { code: 'AE', name: 'UAE', dial: '+971', phLen: 9, phRe: /^5\d{8}$/, phPh: '5X XXX XXXX', idLabel: 'Emirates ID', idLen: 15, idRe: /^784\d{12}$/, idPh: '784-XXXX-XXXXXXX-X', rate: 0.044, step: 5, show: v => 'AED ' + v.toLocaleString('en-US'), postLabel: 'Area', postPh: 'Area (e.g. Al Barsha)', postRe: /\S{2,}/, postMax: 40, text: true, waProp: 'whatsappNumberUAE', waDef: '971500000000', addrProp: 'addressUAE', addrDef: '[UAE centre address]' }
  };
  region() {
    const p = this.props || {}, R = Component.REGIONS;
    if (p.previewRegion && R[p.previewRegion]) return R[p.previewRegion];
    const r = this.state.region; return (r && R[r.code]) || R.IN;
  }
  // Prices are authored in INR; loc() converts + rounds to the local currency step, money() formats an already-local amount.
  roundStep(v) { const st = this.region().step; return Math.round(v / st) * st; }
  loc(n) { const r = this.region(); if (!(n > 0)) return 0; return Math.max(r.step, this.roundStep(n * r.rate)); }
  money(v) { return this.region().show(this.roundStep(v)); }
  inr(n) { return this.money(this.loc(n)); }
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
        else if (la > 6 && la < 37.5 && lo > 68 && lo < 97.5) { code = 'IN'; country = 'India'; }
      }
      if (Component.REGIONS[code]) {
        const region = { code, city, post, ts: Date.now() };
        try { localStorage.setItem('avmlabs_region_v1', JSON.stringify(region)); } catch (e) {}
        this.setState({ region, geo: 'ok' });
      } else this.setState({ geo: 'outside', geoCountry: country || 'your country' });
    }, err => this.setState({ geo: err && err.code === 1 ? 'denied' : 'error' }), { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
  }
