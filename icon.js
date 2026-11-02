(function () {
  if (customElements.get('avm-i')) return;
  class AvmIcon extends HTMLElement {
    static get observedAttributes() { return ['n', 's']; }
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>:host{display:inline-block;flex:none;line-height:0;vertical-align:middle}span{display:block;background:currentColor}</style><span></span>';
      this._st = root.querySelector('style');
      this._i = root.querySelector('span');
    }
    connectedCallback() { this.paint(); }
    attributeChangedCallback() { this.paint(); }
    paint() {
      if (!this._i) return;
      const n = this.getAttribute('n') || 'circle';
      const s = (parseFloat(this.getAttribute('s')) || 18) + 'px';
      const url = n === 'whatsapp'
        ? 'https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/whatsapp.svg'
        : 'https://cdn.jsdelivr.net/npm/lucide-static@0.469.0/icons/' + n + '.svg';
      const m = 'url("' + url + '") center / contain no-repeat';
      this._st.textContent = ':host{display:inline-block;flex:none;line-height:0;vertical-align:middle;width:' + s + ';height:' + s + '}span{display:block;width:100%;height:100%;background:currentColor;-webkit-mask:' + m + ';mask:' + m + '}';
    }
  }
  customElements.define('avm-i', AvmIcon);
})();
