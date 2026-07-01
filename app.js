'use strict';

// Currency — updated from system locale via main process (defaults to MAD)
window.CURRENCY = 'MAD';

class DisplayClient {
  constructor() {
    this.order = { items:[], total:null, paid:null, change:null, discount:null, welcome:false };
    this._bindUI();
    this._initElectron();
    this._initFullscreen();
  }

  _bindUI() {
    const cfgBtn   = document.getElementById('cfgBtn');
    const overlay  = document.getElementById('configOverlay');
    const backdrop = document.getElementById('configBackdrop');
    cfgBtn?.addEventListener('click', () => { overlay.classList.toggle('open'); cfgBtn.classList.toggle('active'); });
    backdrop?.addEventListener('click', () => { overlay.classList.remove('open'); cfgBtn?.classList.remove('active'); });
    document.getElementById('connectBtn')?.addEventListener('click',   () => this._connectPort());
    document.getElementById('addTestBtn')?.addEventListener('click',   () => this._addTest());
    document.getElementById('resetBtn')?.addEventListener('click',     () => this._reset());
    document.getElementById('simulateBtn')?.addEventListener('click',  () => this._simulate());
    document.getElementById('feedbackBugBtn')?.addEventListener('click', () => this._feedback('bug'));
    document.getElementById('feedbackIdeaBtn')?.addEventListener('click',() => this._feedback('idea'));
  }

  async _initElectron() {
    if (!window.electronAPI) { this._initWS(); return; }
    try {
      const ports = await window.electronAPI.getSerialPorts();
      this._fillPorts(ports);
    } catch(e) { console.error('ports:', e); }

    window.electronAPI.onSerialStatus(d => this._setStatus(d));
    window.electronAPI.onOrderUpdated(d => this._render(d));
    window.electronAPI.onConfigLoaded(d => {
      // Currency from system locale
      if (d.currency) window.CURRENCY = d.currency;
      // IP display
      const ipEl = document.getElementById('localIpDisplay');
      if (ipEl && d.localIp) ipEl.textContent = 'Phone: http://' + d.localIp;
      // Port display
      const portEl = document.getElementById('currentPort');
      if (portEl && d.appPort) portEl.textContent = d.appPort;
      // Language
      if (d.lang && window._applyLangFromConfig) window._applyLangFromConfig(d.lang);
    });
  }

  _initWS() {
    const ws = new WebSocket('ws://' + (location.hostname||'localhost') + ':9600');
    ws.onopen    = () => this._setStatus({ connected:true, port:'WS' });
    ws.onmessage = ({data}) => { try { const m=JSON.parse(data); if(m.type==='ORDER_UPDATE') this._render(m.data); } catch{} };
    ws.onerror   = () => this._setStatus({ connected:false, message:'WS error' });
    ws.onclose   = () => { this._setStatus({ connected:false, message:'Reconnecting...' }); setTimeout(()=>this._initWS(),3000); };
  }

  _initFullscreen() {
    const btn = document.getElementById('fsBtn');
    const icon = document.getElementById('fsIcon');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
      else document.exitFullscreen().catch(()=>{});
    });
    document.addEventListener('fullscreenchange', () => {
      const fs = !!document.fullscreenElement;
      icon?.setAttribute('d', fs
        ? 'M7 3v4H3M13 3v4h4M7 17v4H3M13 17v4h4'
        : 'M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4');
    });
  }

  _fillPorts(ports) {
    const sel = document.getElementById('portSelect');
    if (!sel) return;
    sel.innerHTML = ports.length
      ? ports.map(p => '<option value="'+p.path+'">' + p.path + (p.description?' — '+p.description:'') + '</option>').join('')
      : '<option value="">No COM ports</option>';
  }

  _connectPort() {
    const port = document.getElementById('portSelect')?.value;
    if (!port) { alert('Select a port.'); return; }
    window.electronAPI?.connectToPort(port);
  }

  _addTest() {
    const name  = document.getElementById('itemName')?.value.trim() || 'Product';
    const qty   = parseFloat(document.getElementById('itemQty')?.value) || 1;
    const price = parseFloat(document.getElementById('itemPrice')?.value) || 0;
    if (window.electronAPI) window.electronAPI.addItem({ name, quantity:qty, price });
    else { this.order.items.push({ name, quantity:qty, price, total:+(qty*price).toFixed(2), discount:null }); this._render(this.order); }
    ['itemName','itemQty','itemPrice'].forEach(id => { const el=document.getElementById(id); if(el) el.value=id==='itemQty'?'1':''; });
  }

  _simulate() {
    const t = 'Foie Mixte\n1x 150.00\nViande Hachee\n1x 120.00\nTotal: 270.00\nPaid: 300.00  Change: 30.00';
    window.electronAPI?.simulateSerial(t);
  }

  _reset() {
    if (!confirm('Reset order?')) return;
    if (window.electronAPI) window.electronAPI.resetOrder();
    else { this.order = { items:[], total:null, paid:null, change:null, discount:null, welcome:false }; this._render(this.order); }
  }

  _feedback(type) {
    const REPO = 'Hamidlegardien/posdisplayclientAronium';
    const note = document.getElementById('feedbackText')?.value.trim() || '';
    const t = type === 'bug'
      ? { label:'bug',         title:'[Bug] '  +(note||'Issue'),       body:'## Bug\n\n'+(note||'Describe...')+'\n\n**v1.0.3**\n' }
      : { label:'enhancement', title:'[Idea] '+(note||'Suggestion'),  body:'## Feature\n\n'+(note||'Describe...')+'\n\n**v1.0.3**\n' };
    const url = 'https://github.com/'+REPO+'/issues/new?'+new URLSearchParams({labels:t.label,title:t.title,body:t.body});
    if (window.electronAPI) window.electronAPI.openExternal(url.toString());
    else window.open(url.toString(),'_blank');
    const input = document.getElementById('feedbackText');
    if (input) input.value = '';
  }

  _setStatus({ connected, port, message }) {
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');
    const pe  = document.getElementById('currentPort');
    if (dot) connected ? dot.classList.add('live') : dot.classList.remove('live');
    if (txt) txt.textContent = connected ? 'Connected: '+(port||'') : (message||'Disconnected');
    if (pe && connected && port) pe.textContent = port;
  }

  _render(order) {
    this.order = order;
    if (order.welcome) { this._showWelcome(order.welcomeMessage); return; }
    this._hideWelcome();
    this._renderItems(order.items||[]);
    this._renderTotals(order);
  }

  _renderItems(items) {
    const list = document.getElementById('itemsList');
    if (!list) return;
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><div class="empty-text">Waiting for order</div></div>';
      return;
    }
    items.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'item-row fresh';
      el.style.animationDelay = idx*30+'ms';
      setTimeout(() => el.classList.remove('fresh'), 2500);

      const qty = parseFloat(item.quantity);
      const isKg = !Number.isInteger(qty);
      const qtyTxt = isKg ? qty.toFixed(3).replace(/\.?0+$/,'')+' kg' : qty.toString();

      let badge = '';
      if (item.discount) {
        const lbl = item.discount.isPercent ? '-'+item.discount.value+'%' : '-'+this._fmt(item.discount.value);
        badge = '<span class="disc-tag">'+lbl+'</span>';
      }

      let priceHtml = '<span class="item-price-val">'+this._fmt(item.price)+'</span>';
      if (item.discount) {
        const amt = item.discount.isPercent ? item.price*(item.discount.value/100) : item.discount.value;
        priceHtml  = '<span class="item-price-val struck">'+this._fmt(item.price)+'</span>'
                   + '<span class="item-price-disc">'+this._fmt(item.price - amt)+'</span>';
      }

      el.innerHTML =
        '<div class="item-qty">'+qtyTxt+'</div>' +
        '<div class="item-name">'+this._esc(item.name)+badge+'</div>' +
        '<div class="item-price">'+priceHtml+'</div>' +
        '<div class="item-total">'+this._fmt(item.total)+'</div>';
      list.appendChild(el);
    });
  }

  _renderTotals(order) {
    const items     = order.items || [];
    const sumQty    = items.reduce((s,i) => s+i.quantity, 0);
    const calcTotal = parseFloat(items.reduce((s,i) => s+i.total, 0).toFixed(2));

    const qtyEl = document.getElementById('totalQty');
    if (qtyEl) qtyEl.textContent = Number.isInteger(sumQty) ? sumQty : sumQty.toFixed(3).replace(/\.?0+$/,'');

    // Discount
    const dc = document.getElementById('discChip');
    if (order.discount && dc) {
      const dAmt = order.discount.isPercent ? calcTotal*(order.discount.value/100) : order.discount.value;
      dc.classList.add('visible');
      const dl = document.getElementById('discLabel'); if(dl) dl.textContent = order.discount.isPercent ? 'Discount -'+order.discount.value+'%' : 'Discount';
      const da = document.getElementById('discAmount'); if(da) da.textContent = '-'+this._fmt(dAmt);
    } else dc?.classList.remove('visible');

    // Total
    const displayT = order.total !== null ? order.total : calcTotal;
    const totalEl  = document.getElementById('totalPrice');
    const warnEl   = document.getElementById('totalWarn');
    if (totalEl) {
      totalEl.textContent = this._fmt(displayT);
      totalEl.classList.remove('flash'); void totalEl.offsetWidth; totalEl.classList.add('flash');
    }
    if (warnEl) {
      if (order.total !== null && Math.abs(order.total - calcTotal) > 0.01) {
        warnEl.textContent = 'calc. '+this._fmt(calcTotal); warnEl.classList.add('visible');
      } else warnEl.classList.remove('visible');
    }

    // Paid / Change — show for 5 seconds then fade
    const pb = document.getElementById('paymentBlock');
    if (order.paid !== null && order.paid !== undefined) {
      pb?.classList.add('visible');
      const pa = document.getElementById('paidAmt'); if(pa) pa.textContent = this._fmt(order.paid);
      const ca = document.getElementById('changeAmt'); if(ca) ca.textContent = order.change !== null ? this._fmt(order.change) : '—';
      // Auto-hide after 5 seconds
      clearTimeout(this._paidTimer);
      this._paidTimer = setTimeout(() => {
        pb?.classList.remove('visible');
      }, 5000);
    } else {
      pb?.classList.remove('visible');
      clearTimeout(this._paidTimer);
    }
  }

  _showWelcome(msg) {
    const el  = document.getElementById('welcomeScreen');
    const sub = document.getElementById('welcomeMsg');
    if (sub) sub.textContent = msg || 'Next customer please';
    if (el)  el.classList.add('show');
  }
  _hideWelcome() { document.getElementById('welcomeScreen')?.classList.remove('show'); }

  // _fmt uses system currency (MAD by default, auto-detected from Windows locale)
  _fmt(n) {
    if (n == null || isNaN(n)) return '—';
    return parseFloat(n).toFixed(2) + ' ' + (window.CURRENCY || 'MAD');
  }
  _esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
}

document.addEventListener('DOMContentLoaded', () => { window._app = new DisplayClient(); });
