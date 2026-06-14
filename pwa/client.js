// Currency — received from PC via WebSocket
window.CURRENCY = 'MAD';

'use strict';

// ════════════════════════════════════════════════════════════
//  POSDisplayPWA — Client WebSocket Samsung S9
// ════════════════════════════════════════════════════════════
const WS_PORT         = 9600;
const RECONNECT_DELAY = 3000;
const FRESH_DURATION  = 2500;

class POSDisplayPWA {
  constructor() {
    this.ws             = null;
    this.reconnectTimer = null;
    this.serverIp       = this._detectIp();
    this._connect();
    this._initFullscreen();
    this._keepScreenOn();
  }

  _detectIp() {
    const h = location.hostname;
    if (h && h !== 'localhost' && h !== '127.0.0.1') { localStorage.setItem('pos_ip', h); return h; }
    return localStorage.getItem('pos_ip') || 'localhost';
  }

  _connect() {
    clearTimeout(this.reconnectTimer);
    try { this.ws = new WebSocket(`ws://${this.serverIp}:${WS_PORT}`); } catch {
      this._setStatus(false, 'Error'); this._scheduleReconnect(); return;
    }
    this.ws.onopen    = () => { this._setStatus(true, 'Connected'); this._toast('✓ Connected'); };
    this.ws.onmessage = ({ data }) => { try { const m=JSON.parse(data); if(m.type==='ORDER_UPDATE') { if(m.lang && window._setPwaLang) window._setPwaLang(m.lang); this._render(m.data); } } catch {} };
    this.ws.onerror   = () => this._setStatus(false, 'Network error');
    this.ws.onclose   = () => { this._setStatus(false, 'Reconnecting...'); this._scheduleReconnect(); };
  }

  _scheduleReconnect() { this.reconnectTimer = setTimeout(() => this._connect(), RECONNECT_DELAY); }

  _setStatus(on, label) {
    const dot = document.getElementById('statusDot');
    const lbl = document.getElementById('statusLabel');
    on ? dot?.classList.add('live') : dot?.classList.remove('live');
    if (lbl) lbl.textContent = label;
  }

  _initFullscreen() {
    const btn     = document.getElementById('fsBtnMob');
    const iconPath = document.getElementById('fsIconMob');
    if (!btn) return;

    btn.addEventListener('click', () => {
      // On mobile, requestFullscreen may not be available → webkit fallback
      const el = document.documentElement;
      if (el.requestFullscreen) {
        !document.fullscreenElement
          ? el.requestFullscreen().catch(() => {})
          : document.exitFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        !document.webkitFullscreenElement
          ? el.webkitRequestFullscreen()
          : document.webkitExitFullscreen();
      }
    });

    const onFsChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (iconPath) {
        iconPath.setAttribute('d', isFs
          ? 'M7 3v4H3M13 3v4h4M7 17v4H3M13 17v4h4'
          : 'M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4'
        );
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
  }

  // ════════════════════════════════════════════════════════
  //  RENDU
  // ════════════════════════════════════════════════════════
  _render(order) {
    if (order.welcome) {
      this._showWelcome(order.welcomeMessage);
      this._renderItems([]);
      this._renderTotals({ items:[], total:null, paid:null, change:null, discount:null });
      return;
    }
    this._hideWelcome();
    this._renderItems(order.items || []);
    this._renderTotals(order);
  }

  _renderItems(items) {
    const list = document.getElementById('itemsList');
    if (!list) return;
    list.innerHTML = '';

    if (!items.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><span class="empty-txt">Waiting for order</span></div>';
      return;
    }

    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'item-row fresh';
      row.style.animationDelay = `${idx * 30}ms`;
      setTimeout(() => row.classList.remove('fresh'), FRESH_DURATION);

      // Decimal (kg) or integer quantity
      const qty = parseFloat(item.quantity);
      const isKg = !Number.isInteger(qty);
      const qtyMain = isKg ? qty.toFixed(3).replace(/\.?0+$/, '') : qty.toString();

      // Discount badge
      let discBadge = '';
      if (item.discount) {
        const lbl = item.discount.isPercent ? `-${item.discount.value}%` : `-${this._fmt(item.discount.value)}`;
        discBadge = `<span class="disc-tag">${lbl}</span>`;
      }

      // Price
      let priceHtml = `<span class="i-price-val">${this._fmt(item.price)}</span>`;
      if (item.discount) {
        const amt = item.discount.isPercent ? item.price * (item.discount.value/100) : item.discount.value;
        priceHtml = `<span class="i-price-val struck">${this._fmt(item.price)}</span><span class="i-price-disc">${this._fmt(item.price - amt)}</span>`;
      }

      row.innerHTML = `
        <div class="i-qty">${qtyMain}${isKg ? '<small>kg</small>' : ''}</div>
        <div class="i-name">${this._esc(item.name)}${discBadge}</div>
        <div class="i-price">${priceHtml}</div>
        <div class="i-total">${this._fmt(item.total)}</div>
      `;
      list.appendChild(row);
    });

    // Auto-scroll to bottom
    requestAnimationFrame(() => {
      const zone = document.getElementById('orderZone');
      if (zone) zone.scrollTo({ top: zone.scrollHeight, behavior: 'smooth' });
    });
  }

  _renderTotals(order) {
    const items     = order.items || [];
    const calcTotal = parseFloat(items.reduce((s,i) => s + (i.total||0), 0).toFixed(2));

    // Global discount
    const discRow = document.getElementById('discRowPwa');
    if (order.discount && discRow) {
      const dAmt = order.discount.isPercent ? calcTotal * (order.discount.value/100) : order.discount.value;
      discRow.classList.add('visible');
      const dl = document.getElementById('discLabelPwa');
      const da = document.getElementById('discAmountPwa');
      if (dl) dl.textContent = order.discount.isPercent ? `Remise -${order.discount.value}%` : 'Remise';
      if (da) da.textContent = `-${this._fmt(dAmt)}`;
    } else if (discRow) discRow.classList.remove('visible');

    // Total
    const aroniumT = (order.total !== null && order.total !== undefined) ? order.total : null;
    const displayT = aroniumT !== null ? aroniumT : calcTotal;
    const totalEl  = document.getElementById('totalPrice');
    const calcEl   = document.getElementById('totalCalcPwa');

    if (totalEl) {
      totalEl.classList.remove('flash');
      void totalEl.offsetWidth;
      totalEl.textContent = this._fmt(displayT);
      totalEl.classList.add('flash');
    }
    if (calcEl) {
      if (aroniumT !== null && Math.abs(aroniumT - calcTotal) > 0.01) {
        calcEl.textContent = `calc. ${this._fmt(calcTotal)}`;
        calcEl.classList.add('visible');
      } else {
        calcEl.classList.remove('visible');
      }
    }

    // Paid / Change
    const payRow = document.getElementById('paymentRowPwa');
    const paidEl = document.getElementById('paidAmountPwa');
    const chgEl  = document.getElementById('changeAmountPwa');
    if (order.paid !== null && order.paid !== undefined) {
      if (payRow) payRow.classList.add('visible');
      if (paidEl) paidEl.textContent = this._fmt(order.paid);
      if (chgEl)  chgEl.textContent  = order.change !== null ? this._fmt(order.change) : '—';
    } else if (payRow) payRow.classList.remove('visible');
  }

  _showWelcome(msg) {
    const sc  = document.getElementById('welcomeScreen');
    const sub = document.getElementById('welcomeSubMsg');
    if (sub) sub.textContent = msg || "Prochain client s'il vous plaît";
    if (sc) sc.classList.add('show');
  }
  _hideWelcome() { document.getElementById('welcomeScreen')?.classList.remove('show'); }

  _toast(msg, ms = 2500) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(this._tTimer);
    this._tTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  async _keepScreenOn() {
    if (!('wakeLock' in navigator)) return;
    try {
      this._wl = await navigator.wakeLock.request('screen');
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible')
          try { this._wl = await navigator.wakeLock.request('screen'); } catch {}
      });
    } catch {}
  }

  _feedbackPwa(type) {
    const REPO = 'Hamidlegardien/posdisplayclientAronium'; // ← remplacer par ton username GitHub
    const note = document.getElementById('feedbackNotePwa')?.value.trim() || '';

    const templates = {
      bug: {
        label: 'bug',
        title: `[Bug] ${note || 'Issue from phone'}`,
        body:  `## Bug Report (via PWA)\n\n**Description:**\n${note || 'Describe the issue...'}\n\n**Device:** Phone/PWA\n`,
      },
      idea: {
        label: 'enhancement',
        title: `[Idea] ${note || 'Suggestion from phone'}`,
        body:  `## Feature Request (via PWA)\n\n**Idea:**\n${note || 'Describe your idea...'}\n`,
      },
    };

    const t = templates[type];
    const url = `https://github.com/${REPO}/issues/new?` + new URLSearchParams({
      labels: t.label, title: t.title, body: t.body,
    }).toString();

    window.open(url, '_blank');
    document.getElementById('feedbackPanel').style.display = 'none';
    if (document.getElementById('feedbackNotePwa')) document.getElementById('feedbackNotePwa').value = '';
    this._toast('Opening GitHub Issues...');
  }

  _fmt(n) { if (n===null||n===undefined||isNaN(n)) return '—'; return `${parseFloat(n).toFixed(2)} ${window.CURRENCY || 'MAD'}`; }
  _esc(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
}

document.addEventListener('DOMContentLoaded', () => { window._pwa = new POSDisplayPWA(); });
