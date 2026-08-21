/* ==========================================================================
   Top Man Tailor — shared.js
   Sidebar/topbar shell, theme toggle, toast, confirm-modal, and formatters.
   Included on every page after store.js + seed.js.
   ========================================================================== */

// Force every "Advanced Measurements" disclosure open for the duration of a
// print (closed <details> content can't be reliably revealed via CSS alone
// across browsers), then restore whatever state it was in on screen.
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('details.adv-toggle').forEach(d => {
    d.dataset.wasOpen = d.open ? '1' : '0';
    d.open = true;
  });
});
window.addEventListener('afterprint', () => {
  document.querySelectorAll('details.adv-toggle').forEach(d => {
    d.open = d.dataset.wasOpen === '1';
    delete d.dataset.wasOpen;
  });
});

const NAV_ITEMS = [
  { page: 'dashboard', href: 'index.html', label: 'Dashboard', icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>' },
  { page: 'new-order', href: 'new-order.html', label: 'New Order', icon: '<path d="M12 5v14M5 12h14"/>' },
  { page: 'orders', href: 'orders.html', label: 'Orders', icon: '<path d="M9 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V9.5"/><path d="M9 3h9v6M12 12l6-6"/>' },
  { page: 'customers', href: 'customers.html', label: 'Customers', icon: '<path d="M4 19V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M14 3v5h5"/>' },
  { page: 'karigars', href: 'karigars.html', label: 'Karigars', icon: '<circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.6 3-6.2 7-6.2s7 2.6 7 6.2"/>' },
  { page: 'payments', href: 'payments.html', label: 'Payments', icon: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>' },
  { page: 'settings', href: 'settings.html', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>' }
];

function sidebarHtml(active){
  const shop = Store.getShop();
  const mark = (shop.name || 'Top Man Tailor').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const brandMarkInner = shop.logo ? `<img src="${shop.logo}" alt="Shop logo">` : `<span>${mark}</span>`;
  const navHtml = NAV_ITEMS.map(item => `
    <a class="nav-item${item.page === active ? ' active' : ''}" href="${item.href}">
      <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>
      ${item.label}
    </a>`).join('');
  return `
    <aside class="sidebar" id="appSidebar">
      <div class="brand">
        <div class="brand-mark">${brandMarkInner}</div>
        <div>
          <div class="brand-name">${(shop.name || 'TOP MAN').toUpperCase()}</div>
          <div class="brand-sub">Tailor &amp; Co.</div>
        </div>
      </div>
      <nav class="nav">${navHtml}</nav>
      <div class="sidebar-foot"><b>Order Studio</b><br>Black &amp; Red · Prototype</div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>`;
}

function topbarHtml(){
  return `
    <div class="topbar">
      <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu">
        <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="text" id="globalSearch" placeholder="Search orders, customers, karigars...">
      </div>
      <div class="theme-toggle" id="themeToggle">
        <button id="btnDark" aria-label="Dark mode"><svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg></button>
        <button id="btnLight" aria-label="Light mode"><svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
      </div>
      <div class="bell"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg><span class="dot"></span></div>
      <div class="avatar">TM</div>
    </div>`;
}

/* ---------------- Theme ---------------- */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  const btnDark = document.getElementById('btnDark');
  const btnLight = document.getElementById('btnLight');
  if(btnDark) btnDark.classList.toggle('active', t === 'dark');
  if(btnLight) btnLight.classList.toggle('active', t === 'light');
  localStorage.setItem('theme', t);
}

/* ---------------- Toast ---------------- */
function ensureToastStack(){
  let stack = document.getElementById('toastStack');
  if(!stack){
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.id = 'toastStack';
    document.body.appendChild(stack);
  }
  return stack;
}
function showToast(message, type){
  const stack = ensureToastStack();
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'success' ? ' success' : '');
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 2600);
}

/* ---------------- Confirm dialog ---------------- */
function confirmDialog(opts){
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <div class="modal-head"><h3>${opts.title || 'Are you sure?'}</h3></div>
        <div class="modal-body"><p style="font-size:13.5px;color:var(--text-muted);line-height:1.5;">${opts.message || ''}</p></div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-act="cancel">${opts.cancelText || 'Cancel'}</button>
          <button class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-act="confirm">${opts.confirmText || 'Confirm'}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    function cleanup(result){ overlay.remove(); resolve(result); }
    overlay.addEventListener('click', e => { if(e.target === overlay) cleanup(false); });
    overlay.querySelector('[data-act="cancel"]').addEventListener('click', () => cleanup(false));
    overlay.querySelector('[data-act="confirm"]').addEventListener('click', () => cleanup(true));
  });
}

/* ---------------- Generic modal open/close (for page-defined modals) ---------------- */
function openModal(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('open');
}
function closeModal(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.remove('open');
}
document.addEventListener('click', e => {
  if(e.target.classList && e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
  if(e.target.closest && e.target.closest('[data-close-modal]')){
    const id = e.target.closest('[data-close-modal]').getAttribute('data-close-modal');
    closeModal(id);
  }
});
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
  }
});

/* ---------------- Formatters ---------------- */
function formatCurrency(n){
  n = Number(n || 0);
  return 'Rs ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 });
}
function formatDate(ts){
  if(!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateShort(ts){
  if(!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
// YYYY-MM-DD in LOCAL time, for pre-filling <input type="date"> — toISOString
// would shift the date across UTC+5 (Pakistan) midnight boundaries.
function toDateInputValue(ts){
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Time-of-day greeting for the dashboard hero — cycles through the day on
// its own, no page reload needed since it just reads the current hour.
function timeGreeting(){
  const hour = new Date().getHours();
  if(hour >= 5 && hour < 12) return 'Good Morning';
  if(hour >= 12 && hour < 17) return 'Good Afternoon';
  if(hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}
function daysUntil(ts){
  const MS = 86400000;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(ts); target.setHours(0,0,0,0);
  return Math.round((target - today) / MS);
}
function initials(name){
  return (name || '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
const STATUS_LABEL = { progress: 'In Progress', ready: 'Ready', delivered: 'Delivered' };
const STATUS_BADGE = { progress: 'badge-progress', ready: 'badge-ready', delivered: 'badge-delivered' };

function emptyStateHtml(title, sub){
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <div class="t">${title || 'No results found'}</div>
      <div class="s">${sub || 'Try adjusting your search or filters.'}</div>
    </div>`;
}

/* ---------------- Style option catalogue & illustrations ----------------
   Shared between the New Order style picker and the Order Card, so both
   render the exact same option list and icon for a given style choice.
   Extended for Pukhtoon/Punjabi Shalwar Qameez tailoring (2026-08 update):
   existing option lists are extended/relabeled in place where the new spec
   maps onto them (Collar, Front Style/Placket, Qameez Pocket); SALWAR_OPTS /
   SALWAR_ICON are kept exactly as before so pre-existing orders that stored
   a plain salwar style still render correctly — new orders use the
   region-specific PUKHTOON_SHALWAR_* / PUNJABI_SHALWAR_* sets instead. */
function styleIcon(inner){
  return `<svg viewBox="0 0 48 54" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
const STYLE_TORSO = `<path d="M6 18 L16 6 L32 6 L42 18 L42 50 L6 50 Z"/>`;
const CUSTOM_ICON = styleIcon(`<path d="M10 38 L30 18 L34 22 L14 42 L9 43 Z"/><path d="M27 21 L31 25"/>`);

const SLEEVE_OPTS = ['Straight', 'Regular', 'Slightly Tapered', 'Wide Traditional'];
const SLEEVE_ICON = {
  'Straight': styleIcon(`<path d="M17 4 L31 4 L31 44 L17 44 Z"/>`),
  'Regular': styleIcon(`<path d="M17 4 L31 4 L29 44 L19 44 Z"/>`),
  'Slightly Tapered': styleIcon(`<path d="M16 4 L32 4 L27 44 L21 44 Z"/>`),
  'Wide Traditional': styleIcon(`<path d="M14 4 L34 4 L30 44 L18 44 Z"/>`)
};

const CUFF_OPTS = ['Simple', 'Single Button', 'Double Button', 'Designer Cuff'];
const CUFF_ICON = {
  'Simple': styleIcon(`<path d="M16 4 L32 4 L30 41 L18 41 Z"/><line x1="18" y1="41" x2="30" y2="41" stroke-width="2.2"/>`),
  'Single Button': styleIcon(`<path d="M16 4 L32 4 L30 32 L18 32 Z"/><rect x="17" y="32" width="14" height="13" rx="1.5"/><circle cx="24" cy="38.5" r="1.4" fill="currentColor" stroke="none"/>`),
  'Double Button': styleIcon(`<path d="M16 4 L32 4 L30 32 L18 32 Z"/><rect x="17" y="32" width="14" height="13" rx="1.5"/><circle cx="21.5" cy="38.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="26.5" cy="38.5" r="1.2" fill="currentColor" stroke="none"/>`),
  'Designer Cuff': styleIcon(`<path d="M16 4 L32 4 L30 32 L18 32 Z"/><path d="M17 32 L31 32 L31 39 Q31 45 24 45 Q17 45 17 39 Z"/>`)
};

const COLLAR_OPTS = ['Classic Band Collar', 'Simple Collar', 'Chinese Collar', 'Open Collar', 'No Collar'];
const COLLAR_ICON = {
  'Classic Band Collar': styleIcon(`${STYLE_TORSO}<rect x="14" y="4" width="20" height="5" rx="1.5"/>`),
  'Simple Collar': styleIcon(`${STYLE_TORSO}<path d="M17 6 L24 15 L20 18 L12 8 Z"/><path d="M31 6 L24 15 L28 18 L36 8 Z"/>`),
  'Chinese Collar': styleIcon(`${STYLE_TORSO}<rect x="21" y="1" width="6" height="4" rx="1"/>`),
  'Open Collar': styleIcon(`<path d="M6 18 L16 6 L24 20 L32 6 L42 18 L42 50 L6 50 Z"/>`),
  'No Collar': styleIcon(`<path d="M6 18 L16 6 Q24 12 32 6 L42 18 L42 50 L6 50 Z"/>`)
};

const NECK_OPTS = ['Round', 'V-Neck', 'Straight Opening', 'Traditional Opening'];
const NECK_ICON = {
  'Round': styleIcon(`<path d="M6 18 L16 6 Q24 15 32 6 L42 18 L42 50 L6 50 Z"/>`),
  'V-Neck': styleIcon(`<path d="M6 18 L16 6 L24 19 L32 6 L42 18 L42 50 L6 50 Z"/>`),
  'Straight Opening': styleIcon(STYLE_TORSO),
  'Traditional Opening': styleIcon(`<path d="M6 18 L16 6 L21 6 L24 11 L27 6 L32 6 L42 18 L42 50 L6 50 Z"/>`)
};

const LENGTH_OPTS = ['Short', 'Standard', 'Long', 'Extra Long'];
function lengthIcon(markerY){
  return styleIcon(`<rect x="14" y="4" width="20" height="48" rx="2" stroke-opacity="0.35"/><line x1="10" y1="${markerY}" x2="38" y2="${markerY}" stroke-width="2.4"/><path d="M10 ${markerY} l3 -3M10 ${markerY} l3 3M38 ${markerY} l-3 -3M38 ${markerY} l-3 3" stroke-width="1.4"/>`);
}
const LENGTH_ICON = {
  'Short': lengthIcon(22),
  'Standard': lengthIcon(32),
  'Long': lengthIcon(40),
  'Extra Long': lengthIcon(47)
};

const FIT_OPTS = ['Traditional Loose', 'Regular', 'Comfort Fit', 'Semi-Slim', 'Slim'];
const FIT_ICON = {
  'Traditional Loose': styleIcon(`<path d="M8 10 L16 4 L32 4 L40 10 L40 48 L8 48 Z"/>`),
  'Regular': styleIcon(`<path d="M10 10 L17 4 L31 4 L38 10 L36 48 L12 48 Z"/>`),
  'Comfort Fit': styleIcon(`<path d="M11 10 L17 4 L31 4 L37 10 L34 48 L14 48 Z"/>`),
  'Semi-Slim': styleIcon(`<path d="M12 10 L18 4 L30 4 L36 10 L31 48 L17 48 Z"/>`),
  'Slim': styleIcon(`<path d="M13 10 L18 4 L30 4 L35 10 L28 48 L20 48 Z"/>`)
};
function recommendedFit(region){ return region === 'Pukhtoon' ? 'Traditional Loose' : 'Regular'; }

const PLACKET_OPTS = ['Plain', 'Simple Button Placket', 'Traditional Patti', 'Embroidered Patti', 'Designer Front', 'Custom'];
const PLACKET_ICON = {
  'Plain': styleIcon(STYLE_TORSO),
  'Simple Button Placket': styleIcon(`${STYLE_TORSO}<line x1="24" y1="10" x2="24" y2="47"/><circle cx="24" cy="18" r="1.1" fill="currentColor" stroke="none"/><circle cx="24" cy="27" r="1.1" fill="currentColor" stroke="none"/><circle cx="24" cy="36" r="1.1" fill="currentColor" stroke="none"/>`),
  'Traditional Patti': styleIcon(`${STYLE_TORSO}<line x1="21" y1="10" x2="21" y2="47"/><line x1="27" y1="10" x2="27" y2="47"/><circle cx="24" cy="18" r="1.1" fill="currentColor" stroke="none"/><circle cx="24" cy="27" r="1.1" fill="currentColor" stroke="none"/><circle cx="24" cy="36" r="1.1" fill="currentColor" stroke="none"/>`),
  'Embroidered Patti': styleIcon(`${STYLE_TORSO}<line x1="21" y1="10" x2="21" y2="47" stroke-width="1.2"/><line x1="27" y1="10" x2="27" y2="47" stroke-width="1.2"/><path d="M21 14 L27 17 L21 20 L27 23 L21 26 L27 29 L21 32" stroke-width="1"/>`),
  'Designer Front': styleIcon(`${STYLE_TORSO}<path d="M19 9 L29 20 L26 47" stroke-width="1.6"/><circle cx="27" cy="26" r="1.1" fill="currentColor" stroke="none"/><circle cx="26.5" cy="36" r="1.1" fill="currentColor" stroke="none"/>`),
  'Custom': CUSTOM_ICON
};

const POCKET_OPTS = ['No Pocket', '1 Chest Pocket', '2 Chest Pockets', '2 Side Pockets', '1 Chest + 2 Side'];
const POCKET_ICON = {
  'No Pocket': styleIcon(STYLE_TORSO),
  '1 Chest Pocket': styleIcon(`${STYLE_TORSO}<rect x="12" y="25" width="10" height="10" rx="1.2"/>`),
  '2 Chest Pockets': styleIcon(`${STYLE_TORSO}<rect x="10" y="25" width="9" height="9" rx="1.2"/><rect x="29" y="25" width="9" height="9" rx="1.2"/>`),
  '2 Side Pockets': styleIcon(`${STYLE_TORSO}<rect x="8" y="34" width="8" height="10" rx="1.2"/><rect x="32" y="34" width="8" height="10" rx="1.2"/>`),
  '1 Chest + 2 Side': styleIcon(`${STYLE_TORSO}<rect x="17" y="16" width="14" height="9" rx="1.2"/><rect x="8" y="34" width="7" height="9" rx="1.2"/><rect x="33" y="34" width="7" height="9" rx="1.2"/>`)
};

const SHALWAR_LEG_BASE = `<rect x="15" y="2" width="18" height="5" rx="1.5"/><path d="M15 7 L15 46 L21 46 L23 22 L25 22 L27 46 L33 46 L33 7 Z"/>`;
const POCKET_SHALWAR_OPTS = ['No Pocket', '1 Side Pocket', '2 Side Pockets', 'Deep Pockets'];
const POCKET_SHALWAR_ICON = {
  'No Pocket': styleIcon(SHALWAR_LEG_BASE),
  '1 Side Pocket': styleIcon(`${SHALWAR_LEG_BASE}<path d="M27 12 L32 16" stroke-width="1.6"/>`),
  '2 Side Pockets': styleIcon(`${SHALWAR_LEG_BASE}<path d="M21 12 L16 16M27 12 L32 16" stroke-width="1.6"/>`),
  'Deep Pockets': styleIcon(`${SHALWAR_LEG_BASE}<path d="M20 11 L14 18M28 11 L34 18" stroke-width="1.6"/>`)
};
const POCKET_POSITION_OPTS = ['Left', 'Right', 'Both'];
const POCKET_DEPTH_OPTS = ['Standard', 'Deep', 'Extra Deep'];

const DAMAN_OPTS = ['Straight Hem', 'Round Hem', 'Side Slits (Chaak)'];
const DAMAN_ICON = {
  'Straight Hem': styleIcon(`<path d="M10 4 L38 4 L38 44 L10 44 Z"/><line x1="10" y1="44" x2="38" y2="44" stroke-width="2.4"/>`),
  'Round Hem': styleIcon(`<path d="M10 4 L38 4 L38 36 Q38 44 30 44 L18 44 Q10 44 10 36 Z"/>`),
  'Side Slits (Chaak)': styleIcon(`<path d="M10 4 L38 4 L38 44 L10 44 Z"/><line x1="10" y1="44" x2="38" y2="44" stroke-width="2.4"/><line x1="13" y1="44" x2="13" y2="33"/><line x1="35" y1="44" x2="35" y2="33"/>`)
};

// Legacy — kept unchanged so orders saved before the Pukhtoon/Punjabi update
// still render their salwar style correctly (see getOrderShalwarStyle below).
const SALWAR_OPTS = ['Plain Shalwar', 'Pleated Shalwar', 'Tulip Shalwar', 'Trouser Style', 'Patiala Style'];
const SALWAR_ICON = {
  'Plain Shalwar': styleIcon(`<rect x="15" y="2" width="18" height="5" rx="1.5"/><path d="M15 7 L15 46 L21 46 L23 22 L25 22 L27 46 L33 46 L33 7 Z"/>`),
  'Pleated Shalwar': styleIcon(`<rect x="12" y="2" width="24" height="5" rx="1.5"/><path d="M12 7 L12 46 L20 46 L22 22 L26 22 L28 46 L36 46 L36 7 Z"/><line x1="16" y1="7" x2="17" y2="22"/><line x1="20" y1="7" x2="20" y2="22"/><line x1="28" y1="7" x2="28" y2="22"/><line x1="32" y1="7" x2="31" y2="22"/>`),
  'Tulip Shalwar': styleIcon(`<rect x="14" y="2" width="20" height="5" rx="1.5"/><path d="M14 7 C11 20 13 28 20 30 L21 46 L25 46 L25 30 M23 30 L23 46 L27 46 L28 30 C35 28 37 20 34 7 Z"/>`),
  'Trouser Style': styleIcon(`<rect x="15" y="2" width="18" height="5" rx="1.5"/><rect x="14" y="7" width="9" height="39" rx="1.5"/><rect x="25" y="7" width="9" height="39" rx="1.5"/><line x1="18.5" y1="10" x2="18.5" y2="43"/><line x1="29.5" y1="10" x2="29.5" y2="43"/>`),
  'Patiala Style': styleIcon(`<rect x="10" y="2" width="28" height="5" rx="1.5"/><path d="M10 7 L10 38 Q10 46 17 46 L20 46 L22 22 L26 22 L28 46 L31 46 Q38 46 38 38 L38 7 Z"/><line x1="14" y1="7" x2="15" y2="22"/><line x1="18" y1="7" x2="18" y2="22"/><line x1="30" y1="7" x2="30" y2="22"/><line x1="34" y1="7" x2="33" y2="22"/><rect x="16" y="42" width="8" height="5" rx="1.5"/><rect x="24" y="42" width="8" height="5" rx="1.5"/>`)
};

/* ---- Garment style (Pukhtoon / Punjabi) — the extended "garment/style
   selector" required for accurate regional Shalwar Qameez tailoring ---- */
const REGIONAL_OPTS = ['Pukhtoon', 'Punjabi'];
const REGIONAL_ICON = {
  'Pukhtoon': styleIcon(`<rect x="9" y="2" width="30" height="5" rx="1.5"/><path d="M9 7 C7 22 10 32 19 34 L20 46 L26 46 L26 34 M22 34 L22 46 L28 46 L29 34 C38 32 41 22 39 7 Z"/>`),
  'Punjabi': styleIcon(`<rect x="14" y="2" width="20" height="5" rx="1.5"/><path d="M14 7 L15 40 L21 46 L23 22 L25 22 L27 46 L33 40 L34 7 Z"/>`)
};

const PUKHTOON_SHALWAR_OPTS = ['Traditional Wide', 'Extra Wide Pukhtoon', 'Medium Width', 'Modern Pukhtoon'];
const PUKHTOON_SHALWAR_ICON = {
  'Traditional Wide': styleIcon(`<rect x="9" y="2" width="30" height="5" rx="1.5"/><path d="M9 7 C7 22 10 32 19 34 L20 46 L26 46 L26 34 M22 34 L22 46 L28 46 L29 34 C38 32 41 22 39 7 Z"/>`),
  'Extra Wide Pukhtoon': styleIcon(`<rect x="7" y="2" width="34" height="5" rx="1.5"/><path d="M7 7 C5 24 9 34 19 36 L20 46 L26 46 L26 36 M22 36 L22 46 L28 46 L29 36 C39 34 43 24 41 7 Z"/>`),
  'Medium Width': styleIcon(`<rect x="12" y="2" width="24" height="5" rx="1.5"/><path d="M12 7 L11 26 C11 32 15 35 20 36 L21 46 L25 46 L25 36 M23 36 L23 46 L27 46 L28 36 C33 35 37 32 37 26 L36 7 Z"/>`),
  'Modern Pukhtoon': styleIcon(`<rect x="14" y="2" width="20" height="5" rx="1.5"/><path d="M14 7 L13 28 C13 32 16 34 20 35 L21 46 L25 46 L25 35 M23 35 L23 46 L27 46 L28 35 C32 34 35 32 35 28 L34 7 Z"/>`)
};

const PUNJABI_SHALWAR_OPTS = ['Classic Punjabi', 'Straight Punjabi', 'Moderate Width', 'Narrow / Modern'];
const PUNJABI_SHALWAR_ICON = {
  'Classic Punjabi': styleIcon(`<rect x="12" y="2" width="24" height="5" rx="1.5"/><path d="M12 7 L13 38 L20 46 L22 22 L26 22 L28 46 L35 38 L36 7 Z"/>`),
  'Straight Punjabi': styleIcon(`<rect x="14" y="2" width="20" height="5" rx="1.5"/><rect x="13" y="7" width="10" height="39" rx="1.5"/><rect x="25" y="7" width="10" height="39" rx="1.5"/>`),
  'Moderate Width': styleIcon(SHALWAR_LEG_BASE),
  'Narrow / Modern': styleIcon(`<rect x="16" y="2" width="16" height="5" rx="1.5"/><rect x="16" y="7" width="8" height="39" rx="1.5"/><rect x="26" y="7" width="8" height="39" rx="1.5"/>`)
};

const MORI_OPTS = ['Very Wide', 'Wide', 'Medium', 'Narrow', 'Custom'];
const MORI_ICON = {
  'Very Wide': styleIcon(`<path d="M18 4 L30 4 L38 44 L32 48 L16 48 L10 44 Z"/><line x1="16" y1="48" x2="32" y2="48" stroke-width="2.2"/>`),
  'Wide': styleIcon(`<path d="M19 4 L29 4 L35 44 L30 48 L18 48 L13 44 Z"/><line x1="18" y1="48" x2="30" y2="48" stroke-width="2.2"/>`),
  'Medium': styleIcon(`<path d="M20 4 L28 4 L32 44 L28 48 L20 48 L16 44 Z"/><line x1="20" y1="48" x2="28" y2="48" stroke-width="2.2"/>`),
  'Narrow': styleIcon(`<path d="M21 4 L27 4 L29 44 L26 48 L22 48 L19 44 Z"/><line x1="22" y1="48" x2="26" y2="48" stroke-width="2.2"/>`),
  'Custom': CUSTOM_ICON
};

const WAIST_TYPE_OPTS = ['Elastic', 'Nada / Drawstring', 'Button + Nada', 'Traditional Waist'];
const WAIST_TYPE_ICON = {
  'Elastic': styleIcon(`<rect x="10" y="20" width="28" height="10" rx="5"/><path d="M12 25 Q16 21 20 25 Q24 29 28 25 Q32 21 36 25"/>`),
  'Nada / Drawstring': styleIcon(`<rect x="10" y="20" width="28" height="8" rx="2"/><path d="M22 24 Q20 30 16 32 M26 24 Q28 30 32 32" stroke-width="1.6"/><circle cx="24" cy="24" r="1.3" fill="currentColor" stroke="none"/>`),
  'Button + Nada': styleIcon(`<rect x="10" y="18" width="28" height="8" rx="2"/><circle cx="18" cy="22" r="1.6" fill="currentColor" stroke="none"/><path d="M28 22 Q26 28 22 30 M32 22 Q34 28 38 30" stroke-width="1.6"/>`),
  'Traditional Waist': styleIcon(`<rect x="9" y="18" width="30" height="12" rx="2"/>`)
};

/* ---- Fabric & button options — plain dropdowns via the existing .field
   select pattern (no icon set; extend here rather than a separate system) ---- */
const FABRIC_OPTS = ['Wash & Wear', 'Cotton', 'Khaddar', 'Linen', 'Blended', 'Karandi', 'Premium Wash & Wear', 'Customer Supplied'];
const BUTTON_STYLE_OPTS = ['Standard', 'Premium', 'Wooden', 'Metal', 'Matching Fabric', 'Custom'];
const BUTTON_COUNT_OPTS = ['3', '4', '5', 'Custom'];

const COLOR_OPTS = [
  { hex: '#1a1a1a', name: 'Black' },
  { hex: '#F2F2F4', name: 'White' },
  { hex: '#1F3A5F', name: 'Navy Blue' },
  { hex: '#4A6FA5', name: 'Sky Blue' },
  { hex: '#6B6B6F', name: 'Grey' },
  { hex: '#5C1A1A', name: 'Maroon' },
  { hex: '#4A5D23', name: 'Olive Green' },
  { hex: '#6B4226', name: 'Brown' },
  { hex: '#D8C7A1', name: 'Beige' },
  { hex: '#E51A2E', name: 'Red' },
  { hex: '#F5EEDC', name: 'Cream' },
  { hex: '#2E5AAC', name: 'Blue' },
  { hex: '#2E6B3E', name: 'Green' }
];
function colorName(hex){
  const match = COLOR_OPTS.find(c => c.hex.toLowerCase() === (hex || '').toLowerCase());
  return match ? match.name : (hex || '—');
}

// Resolves the shalwar-style row for the Order Card / WhatsApp text: prefers
// the new region-specific value, falls back to the legacy flat "salwar"
// value for orders saved before the Pukhtoon/Punjabi update.
function getOrderShalwarStyle(style){
  if(style.shalwarStyle){
    const iconMap = style.regionalStyle === 'Punjabi' ? PUNJABI_SHALWAR_ICON : PUKHTOON_SHALWAR_ICON;
    return { label: style.shalwarStyle, icon: iconMap[style.shalwarStyle] };
  }
  if(style.salwar) return { label: style.salwar, icon: SALWAR_ICON[style.salwar] };
  return null;
}

/* ---------------- Order Card (job card) ----------------
   A full-info snapshot of a single order — customer, measurements, style,
   photos — shared by the Karigar, Customer, and Orders pages. Measurements
   are read from order.measurementSnapshot (captured at order-creation time
   in new-order.js) so the card stays accurate even if the customer's
   measurement record is later updated by a newer order; orders saved before
   this existed fall back to the customer's current measurement on file. */
function getOrderMeasurement(order){
  if(order.measurementSnapshot) return order.measurementSnapshot;
  const list = Store.getMeasurementsForCustomer(order.customerId).sort((a, b) => b.updatedAt - a.updatedAt);
  return list[0] || null;
}

function measItemsHtml(fieldList, fields){
  return fieldList.map(f => `<div class="oc-meas-item"><span class="k">${f.label}</span><span class="v mono">${(fields && fields[f.key]) || '—'}</span></div>`).join('');
}

// Renders a template's fields grouped (e.g. "Qameez" vs "Shalwar") with any
// field flagged `advanced: true` tucked into a collapsed "Advanced
// Measurements" section — keeps the core set visible without overwhelming
// the user, per fields not marked advanced default to core (old templates
// without the flag are unaffected).
function buildMeasurementBlockHtml(templateKey, fields, notes){
  const tpl = Store.getTemplates()[templateKey] || { label: templateKey, fields: [] };
  const core = tpl.fields.filter(f => !f.advanced);
  const advanced = tpl.fields.filter(f => f.advanced);
  const groups = [...new Set(core.map(f => f.group || 'Measurements'))];
  const showGroups = groups.length > 1;

  let html = `<div class="oc-section-title">${tpl.label} — Measurements</div><div class="form-grid cols-4 oc-meas-grid">`;
  let lastGroup = null;
  core.forEach(f => {
    const g = f.group || 'Measurements';
    if(showGroups && g !== lastGroup){
      html += `<div class="grid-span-4 meas-group-heading${lastGroup ? ' spaced' : ''}">${g}</div>`;
      lastGroup = g;
    }
    html += measItemsHtml([f], fields);
  });
  html += `</div>`;

  if(advanced.length){
    const advGroups = [...new Set(advanced.map(f => f.group || 'Measurements'))];
    const showAdvGroups = advGroups.length > 1;
    let advBody = '';
    let lastAdvGroup = null;
    advanced.forEach(f => {
      const g = f.group || 'Measurements';
      if(showAdvGroups && g !== lastAdvGroup){
        advBody += `<div class="grid-span-4 meas-group-heading${lastAdvGroup ? ' spaced' : ''}">${g}</div>`;
        lastAdvGroup = g;
      }
      advBody += measItemsHtml([f], fields);
    });
    html += `<details class="adv-toggle"><summary>Advanced Measurements</summary><div class="form-grid cols-4 oc-meas-grid adv-toggle-body">${advBody}</div></details>`;
  }

  if(notes) html += `<div class="oc-notes"><b>Notes:</b> ${notes}</div>`;
  return html;
}

// Editable counterpart to buildMeasurementBlockHtml — same grouping/advanced
// split, but renders <input> fields instead of read-only text. Used by both
// New Order (capturing measurements for a fresh order) and the Customer
// Detail "Edit Measurements" mode, so the two never drift apart.
function buildEditableMeasurementFieldsHtml(templateKey, existingFields){
  const tpl = Store.getTemplates()[templateKey];
  if(!tpl) return '';
  const core = tpl.fields.filter(f => !f.advanced);
  const advanced = tpl.fields.filter(f => f.advanced);
  const groups = [...new Set(core.map(f => f.group || 'Measurements'))];
  const showGroups = groups.length > 1;

  function fieldHtml(f){
    return `
      <div class="field">
        <label>${f.label}</label>
        <input type="text" class="mono" data-key="${f.key}" value="${(existingFields && existingFields[f.key]) || ''}" placeholder="in inches">
      </div>`;
  }

  let html = '';
  let lastGroup = null;
  core.forEach(f => {
    const g = f.group || 'Measurements';
    if(showGroups && g !== lastGroup){
      html += `<div class="grid-span-4 meas-group-heading${lastGroup ? ' spaced' : ''}">${g} Measurements</div>`;
      lastGroup = g;
    }
    html += fieldHtml(f);
  });

  if(advanced.length){
    const advGroups = [...new Set(advanced.map(f => f.group || 'Measurements'))];
    const showAdvGroups = advGroups.length > 1;
    let advBody = '';
    let lastAdvGroup = null;
    advanced.forEach(f => {
      const g = f.group || 'Measurements';
      if(showAdvGroups && g !== lastAdvGroup){
        advBody += `<div class="grid-span-4 meas-group-heading${lastAdvGroup ? ' spaced' : ''}">${g} Advanced</div>`;
        lastAdvGroup = g;
      }
      advBody += fieldHtml(f);
    });
    html += `<div class="grid-span-4"><details class="adv-toggle"><summary>Advanced Measurements</summary><div class="form-grid cols-4 adv-toggle-body">${advBody}</div></details></div>`;
  }

  return html;
}

function buildOrderCardHtml(order){
  const customer = Store.getCustomer(order.customerId);
  const karigar = Store.getKarigar(order.karigarId);
  const meas = getOrderMeasurement(order);
  const paid = Store.paidAmountForOrder(order.id);
  const pending = Math.max(0, order.totalAmount - paid);
  const style = order.style || {};
  const shalwarStyle = getOrderShalwarStyle(style);

  const styleRows = [
    ['Region', style.regionalStyle, REGIONAL_ICON],
    ['Fit', style.fit, FIT_ICON],
    ['Length', style.length, LENGTH_ICON],
    ['Collar', style.collar, COLLAR_ICON],
    ['Neck', style.neck, NECK_ICON],
    ['Sleeve', style.sleeve, SLEEVE_ICON],
    ['Cuff', style.cuff, CUFF_ICON],
    ['Front Style', style.placket, PLACKET_ICON],
    ['Qameez Pocket', style.pocket, POCKET_ICON],
    ['Shalwar Pocket', style.pocketShalwar, POCKET_SHALWAR_ICON],
    ['Mori / Pauncha', style.mori, MORI_ICON],
    ['Waist', style.waistType, WAIST_TYPE_ICON],
    ['Daman', style.daman, DAMAN_ICON]
  ].filter(row => row[1]);
  if(shalwarStyle) styleRows.splice(4, 0, ['Shalwar', shalwarStyle.label, { [shalwarStyle.label]: shalwarStyle.icon }]);

  const textOnlyRows = [
    ['Pocket Position', style.pocketPosition],
    ['Pocket Depth', style.pocketDepth],
    ['Fabric', style.fabric],
    ['Buttons', style.buttonStyle],
    ['Button Count', style.buttonCount]
  ].filter(row => row[1]);

  let html = `
    <div class="oc-header">
      <div>
        <div class="oc-order-no mono">${order.orderNo}</div>
        <div class="oc-sub">Assigned ${formatDate(order.assignedDate)} · Deadline ${formatDate(order.deadline)}</div>
      </div>
      <span class="badge ${STATUS_BADGE[order.status]}">${STATUS_LABEL[order.status]}</span>
    </div>
    <div class="oc-grid">
      <div class="oc-block">
        <div class="oc-section-title">Customer</div>
        <div class="oc-kv"><span>Name</span><b>${customer ? customer.name : '—'}</b></div>
        <div class="oc-kv"><span>Phone</span><b class="mono">${customer ? customer.phone : '—'}</b></div>
        <div class="oc-kv"><span>Address</span><b>${customer ? (customer.address || '—') : '—'}</b></div>
      </div>
      <div class="oc-block">
        <div class="oc-section-title">Assignment</div>
        <div class="oc-kv"><span>Karigar</span><b>${karigar ? karigar.name : '—'}</b></div>
        <div class="oc-kv"><span>Total</span><b class="mono">${formatCurrency(order.totalAmount)}</b></div>
        <div class="oc-kv"><span>Paid</span><b class="mono">${formatCurrency(paid)}</b></div>
        <div class="oc-kv"><span>Balance</span><b class="mono ${pending > 0 ? 'balance-pending' : 'balance-paid'}">${pending > 0 ? formatCurrency(pending) : 'Paid'}</b></div>
      </div>
    </div>`;

  html += meas ? buildMeasurementBlockHtml(meas.template, meas.fields, meas.notes) : emptyStateHtml('No measurements on file for this order');

  if(styleRows.length || style.color){
    html += `<div class="oc-section-title" style="margin-top:18px;">Style Customization</div><div class="oc-style-grid">`;
    html += styleRows.map(row => `<div class="oc-style-item"><div class="oc-style-cat">${row[0]}</div>${row[2][row[1]] || ''}<span>${row[1]}</span></div>`).join('');
    if(style.color){
      html += `<div class="oc-style-item"><div class="oc-style-cat">Color</div><div class="color-dot" style="background:${style.color};width:34px;height:34px;cursor:default;"></div><span>${colorName(style.color)}</span></div>`;
    }
    html += `</div>`;
  }

  if(textOnlyRows.length){
    html += `<div class="oc-block" style="margin-top:14px;">`;
    html += textOnlyRows.map(row => `<div class="oc-kv"><span>${row[0]}</span><b>${row[1]}</b></div>`).join('');
    html += `</div>`;
  }

  if(order.photoRefs && order.photoRefs.length){
    html += `<div class="oc-section-title" style="margin-top:18px;">Reference Photos</div><div class="photo-thumbs">`;
    html += order.photoRefs.map(src => `<div class="photo-thumb"><img src="${src}"></div>`).join('');
    html += `</div>`;
  }

  return html;
}

function buildOrderWhatsAppText(order, audience){
  const customer = Store.getCustomer(order.customerId);
  const meas = getOrderMeasurement(order);
  const tpl = meas ? (Store.getTemplates()[meas.template] || { label: meas.template, fields: [] }) : null;
  const style = order.style || {};
  const paid = Store.paidAmountForOrder(order.id);
  const pending = Math.max(0, order.totalAmount - paid);

  const lines = [];
  if(audience === 'karigar'){
    lines.push(`*New Order Assigned — ${order.orderNo}*`);
    lines.push(`Customer: ${customer ? customer.name : '—'} (${customer ? customer.phone : '—'})`);
  } else {
    lines.push(`*Order Confirmation — ${order.orderNo}*`);
    lines.push(`Top Man Tailor`);
  }
  lines.push(`Garment: ${tpl ? tpl.label : '—'}`);
  lines.push(`Deadline: ${formatDate(order.deadline)}`);
  lines.push(`Status: ${STATUS_LABEL[order.status]}`);
  lines.push('');

  if(meas && tpl){
    lines.push('MEASUREMENTS');
    tpl.fields.forEach(f => lines.push(`${f.label}: ${(meas.fields && meas.fields[f.key]) || '—'}`));
    if(meas.notes) lines.push(`Notes: ${meas.notes}`);
    lines.push('');
  }

  const shalwarStyle = getOrderShalwarStyle(style);
  const styleParts = [];
  if(style.regionalStyle) styleParts.push(`Region: ${style.regionalStyle}`);
  if(style.fit) styleParts.push(`Fit: ${style.fit}`);
  if(style.length) styleParts.push(`Length: ${style.length}`);
  if(style.collar) styleParts.push(`Collar: ${style.collar}`);
  if(style.neck) styleParts.push(`Neck: ${style.neck}`);
  if(style.sleeve) styleParts.push(`Sleeve: ${style.sleeve}`);
  if(style.cuff) styleParts.push(`Cuff: ${style.cuff}`);
  if(shalwarStyle) styleParts.push(`Shalwar: ${shalwarStyle.label}`);
  if(style.mori) styleParts.push(`Mori / Pauncha: ${style.mori}`);
  if(style.waistType) styleParts.push(`Waist: ${style.waistType}`);
  if(style.placket) styleParts.push(`Front Style: ${style.placket}`);
  if(style.pocket) styleParts.push(`Qameez Pocket: ${style.pocket}`);
  if(style.pocketShalwar) styleParts.push(`Shalwar Pocket: ${style.pocketShalwar}`);
  if(style.pocketPosition) styleParts.push(`Pocket Position: ${style.pocketPosition}`);
  if(style.pocketDepth) styleParts.push(`Pocket Depth: ${style.pocketDepth}`);
  if(style.daman) styleParts.push(`Daman: ${style.daman}`);
  if(style.fabric) styleParts.push(`Fabric: ${style.fabric}`);
  if(style.buttonStyle) styleParts.push(`Buttons: ${style.buttonStyle}`);
  if(style.buttonCount) styleParts.push(`Button Count: ${style.buttonCount}`);
  if(style.color) styleParts.push(`Color: ${colorName(style.color)}`);
  if(styleParts.length){
    lines.push('STYLE');
    lines.push(...styleParts);
    lines.push('');
  }

  if(audience === 'karigar'){
    lines.push('Assigned by: Top Man Tailor (shop owner)');
  } else {
    lines.push(`Total: ${formatCurrency(order.totalAmount)} | Paid: ${formatCurrency(paid)} | Balance: ${pending > 0 ? formatCurrency(pending) : 'Paid in full'}`);
    lines.push('');
    lines.push('— Top Man Tailor');
  }
  return lines.join('\n');
}

function sendOrderWhatsApp(order, audience){
  const target = audience === 'karigar' ? Store.getKarigar(order.karigarId) : Store.getCustomer(order.customerId);
  if(!target || !target.phone){ showToast('No phone number on file for ' + (audience === 'karigar' ? 'this karigar' : 'this customer')); return; }
  const text = buildOrderWhatsAppText(order, audience);
  const digits = target.phone.replace(/[^\d]/g, '');
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, '_blank');
}

const EDIT_ICON = `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>`;
const PAYMENT_ICON = `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`;

// Quick "record a payment against this order" modal — reachable from order
// rows everywhere (Orders, Customer Detail, Karigar Detail) and from the
// Order Card, since customers commonly pay partially at order time and the
// rest later (on delivery, or in further installments). Any number of these
// can be recorded over time; the running balance is always derived live from
// Store.paidAmountForOrder, never stored as a single field.
function openAddPaymentModal(orderId, onSaved){
  const order = Store.getOrder(orderId);
  if(!order){ showToast('Order not found'); return; }
  const customer = Store.getCustomer(order.customerId);
  const paid = Store.paidAmountForOrder(order.id);
  const pending = Math.max(0, order.totalAmount - paid);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <h3>Add Payment</h3>
        <button class="modal-close" data-act="close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="oc-block">
          <div class="oc-kv"><span>Order</span><b class="mono">${order.orderNo}</b></div>
          <div class="oc-kv"><span>Customer</span><b>${customer ? customer.name : '—'}</b></div>
          <div class="oc-kv"><span>Total</span><b class="mono">${formatCurrency(order.totalAmount)}</b></div>
          <div class="oc-kv"><span>Already Paid</span><b class="mono">${formatCurrency(paid)}</b></div>
          <div class="oc-kv"><span>Balance Due</span><b class="mono ${pending > 0 ? 'balance-pending' : 'balance-paid'}">${pending > 0 ? formatCurrency(pending) : 'Paid'}</b></div>
        </div>
        <div class="field"><label>Amount (Rs)</label><input type="number" id="apAmount" min="0" placeholder="e.g. ${pending || ''}"></div>
        <div class="field">
          <label>Method</label>
          <select id="apMethod">
            <option value="cash">Cash</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="jazzcash">JazzCash</option>
            <option value="bank">Bank</option>
          </select>
        </div>
        <div class="field"><label>Note (optional)</label><input type="text" id="apNote" placeholder="e.g. Remaining balance on delivery"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" data-act="close">Cancel</button>
        <button class="btn btn-primary" data-act="save">Save Payment</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  function cleanup(){ overlay.remove(); }
  overlay.addEventListener('click', e => { if(e.target === overlay) cleanup(); });
  overlay.querySelectorAll('[data-act="close"]').forEach(b => b.addEventListener('click', cleanup));
  overlay.querySelector('[data-act="save"]').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('apAmount').value);
    if(!amount || amount <= 0){ showToast('Enter a valid amount'); return; }
    Store.addPayment({
      id: Store.uid('pay'),
      orderId: order.id,
      amount,
      method: document.getElementById('apMethod').value,
      date: Date.now(),
      note: document.getElementById('apNote').value.trim() || (amount >= pending ? 'Final Payment' : 'Partial Payment')
    });
    cleanup();
    showToast('Payment recorded', 'success');
    if(onSaved) onSaved();
  });
}

// Order-level corrections (karigar, deadline, status, total amount).
// Measurements/style/photos are intentionally NOT editable here — they're
// frozen in order.measurementSnapshot as the record of what the karigar was
// actually given to make (see getOrderMeasurement); to change the design,
// create a fresh order instead.
function openEditOrderModal(orderId, onSaved){
  const order = Store.getOrder(orderId);
  if(!order){ showToast('Order not found'); return; }
  const karigars = Store.getKarigars();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <h3>Edit ${order.orderNo}</h3>
        <button class="modal-close" data-act="close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="field"><label>Karigar</label>
          <select id="eoKarigar">${karigars.map(k => `<option value="${k.id}" ${k.id === order.karigarId ? 'selected' : ''}>${k.name} — ${k.speciality || ''}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Deadline</label><input type="date" id="eoDeadline" value="${toDateInputValue(order.deadline)}"></div>
        <div class="field"><label>Order Status</label>
          <select id="eoStatus">
            <option value="progress" ${order.status === 'progress' ? 'selected' : ''}>In Progress</option>
            <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          </select>
        </div>
        <div class="field"><label>Total Order Amount (Rs)</label><input type="number" id="eoTotal" min="0" value="${order.totalAmount}"></div>
        <div class="hint">Measurements, style and photos stay locked to what the karigar was given — start a new order if the design itself needs to change.</div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" data-act="close">Cancel</button>
        <button class="btn btn-primary" data-act="save">Save Changes</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  function cleanup(){ overlay.remove(); }
  overlay.addEventListener('click', e => { if(e.target === overlay) cleanup(); });
  overlay.querySelectorAll('[data-act="close"]').forEach(b => b.addEventListener('click', cleanup));
  overlay.querySelector('[data-act="save"]').addEventListener('click', () => {
    const total = parseFloat(document.getElementById('eoTotal').value);
    if(!total || total <= 0){ showToast('Enter a valid total order amount'); return; }
    const deadlineInput = document.getElementById('eoDeadline').value;
    if(!deadlineInput){ showToast('Please choose a deadline'); return; }
    const status = document.getElementById('eoStatus').value;
    const patch = {
      karigarId: document.getElementById('eoKarigar').value,
      deadline: new Date(deadlineInput).getTime(),
      status,
      totalAmount: total,
      deliveredDate: status === 'delivered' ? (order.deliveredDate || Date.now()) : null
    };
    Store.updateOrder(order.id, patch);
    cleanup();
    showToast('Order updated', 'success');
    if(onSaved) onSaved();
  });
}

function openOrderCardModal(orderId){
  const order = Store.getOrder(orderId);
  if(!order){ showToast('Order not found'); return; }
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-box wide">
      <div class="modal-head no-print">
        <h3>Order Card</h3>
        <button class="modal-close" data-act="close">&times;</button>
      </div>
      <div class="modal-body print-area" id="ocBody">${buildOrderCardHtml(order)}</div>
      <div class="modal-foot no-print" style="justify-content:space-between; flex-wrap:wrap;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" data-act="edit">Edit Order</button>
          <button class="btn btn-outline btn-sm" data-act="pay">Add Payment</button>
          <button class="btn btn-outline btn-sm" data-act="whatsapp-karigar">WhatsApp Karigar</button>
          <button class="btn btn-outline btn-sm" data-act="whatsapp-customer">WhatsApp Customer</button>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-outline btn-sm" data-act="print">Print</button>
          <button class="btn btn-primary btn-sm" data-act="close">Close</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  function cleanup(){ overlay.remove(); }
  function refreshCard(){
    const fresh = Store.getOrder(orderId);
    if(fresh) overlay.querySelector('#ocBody').innerHTML = buildOrderCardHtml(fresh);
  }
  overlay.addEventListener('click', e => { if(e.target === overlay) cleanup(); });
  overlay.querySelectorAll('[data-act="close"]').forEach(b => b.addEventListener('click', cleanup));
  overlay.querySelector('[data-act="whatsapp-karigar"]').addEventListener('click', () => sendOrderWhatsApp(Store.getOrder(orderId), 'karigar'));
  overlay.querySelector('[data-act="whatsapp-customer"]').addEventListener('click', () => sendOrderWhatsApp(Store.getOrder(orderId), 'customer'));
  overlay.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
  overlay.querySelector('[data-act="edit"]').addEventListener('click', () => openEditOrderModal(orderId, refreshCard));
  overlay.querySelector('[data-act="pay"]').addEventListener('click', () => openAddPaymentModal(orderId, refreshCard));
}

/* ---------------- Global search (topbar) ---------------- */
function runGlobalSearch(q){
  q = (q || '').trim().toLowerCase();
  if(!q) return;
  const customers = Store.getCustomers();
  const custMatch = customers.find(c =>
    c.name.toLowerCase().includes(q) ||
    (c.phone || '').toLowerCase().includes(q) ||
    (c.customerId || '').toLowerCase().includes(q)
  );
  if(custMatch){ window.location.href = 'customer-detail.html?id=' + encodeURIComponent(custMatch.id); return; }
  const orders = Store.getOrders();
  const orderMatch = orders.find(o => (o.orderNo || '').toLowerCase().includes(q));
  if(orderMatch){ window.location.href = 'orders.html?q=' + encodeURIComponent(orderMatch.orderNo); return; }
  window.location.href = 'orders.html?q=' + encodeURIComponent(q);
}

/* ---------------- Shell init ---------------- */
const Shared = {
  init(activePage){
    seedRun();
    const sidebarMount = document.getElementById('sidebarMount');
    const topbarMount = document.getElementById('topbarMount');
    if(sidebarMount) sidebarMount.innerHTML = sidebarHtml(activePage);
    if(topbarMount) topbarMount.innerHTML = topbarHtml();

    const saved = localStorage.getItem('theme') || Store.getShop().themeDefault || 'dark';
    applyTheme(saved);
    const btnDark = document.getElementById('btnDark');
    const btnLight = document.getElementById('btnLight');
    if(btnDark) btnDark.addEventListener('click', () => applyTheme('dark'));
    if(btnLight) btnLight.addEventListener('click', () => applyTheme('light'));

    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    function closeSidebar(){ sidebar.classList.remove('open'); overlay.classList.remove('open'); }
    if(hamburger){
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
      });
      overlay.addEventListener('click', closeSidebar);
    }

    const search = document.getElementById('globalSearch');
    if(search){
      search.addEventListener('keydown', e => {
        if(e.key === 'Enter') runGlobalSearch(search.value);
      });
    }

    ensureToastStack();
  }
};
