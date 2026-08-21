/* ==========================================================================
   Top Man Tailor — orders.js
   Full order list: search, filters, inline status update.
   ========================================================================== */

(function(){
  const custById = () => Object.fromEntries(Store.getCustomers().map(c => [c.id, c]));
  const karById = () => Object.fromEntries(Store.getKarigars().map(k => [k.id, k]));

  const fSearch = document.getElementById('fSearch');
  const fStatus = document.getElementById('fStatus');
  const fKarigar = document.getElementById('fKarigar');
  const fFrom = document.getElementById('fFrom');
  const fTo = document.getElementById('fTo');
  const fSort = document.getElementById('fSort');
  const body = document.getElementById('ordersBody');
  const emptyEl = document.getElementById('ordersEmpty');
  const countEl = document.getElementById('orderCount');

  const karigars = Store.getKarigars();
  fKarigar.innerHTML += karigars.map(k => `<option value="${k.id}">${k.name}</option>`).join('');

  const params = new URLSearchParams(window.location.search);
  if(params.get('q')) fSearch.value = params.get('q');

  function pendingFor(order){
    return Math.max(0, Number(order.totalAmount || 0) - Store.paidAmountForOrder(order.id));
  }

  function render(){
    const cust = custById();
    const kar = karById();
    let orders = Store.getOrders();

    const q = fSearch.value.trim().toLowerCase();
    if(q){
      orders = orders.filter(o => {
        const c = cust[o.customerId];
        return (o.orderNo || '').toLowerCase().includes(q) || (c && c.name.toLowerCase().includes(q)) || (c && (c.phone||'').toLowerCase().includes(q));
      });
    }
    if(fStatus.value) orders = orders.filter(o => o.status === fStatus.value);
    if(fKarigar.value) orders = orders.filter(o => o.karigarId === fKarigar.value);
    if(fFrom.value){ const t = new Date(fFrom.value).setHours(0,0,0,0); orders = orders.filter(o => o.deadline >= t); }
    if(fTo.value){ const t = new Date(fTo.value).setHours(23,59,59,999); orders = orders.filter(o => o.deadline <= t); }

    switch(fSort.value){
      case 'deadline-desc': orders.sort((a,b)=>b.deadline-a.deadline); break;
      case 'assigned-desc': orders.sort((a,b)=>b.assignedDate-a.assignedDate); break;
      default: orders.sort((a,b)=>a.deadline-b.deadline);
    }

    countEl.textContent = orders.length + ' order' + (orders.length === 1 ? '' : 's');

    if(orders.length === 0){
      body.innerHTML = '';
      emptyEl.innerHTML = emptyStateHtml('No orders found', 'Try adjusting your search or filters.');
      return;
    }
    emptyEl.innerHTML = '';

    body.innerHTML = orders.map(o => {
      const c = cust[o.customerId];
      const k = kar[o.karigarId];
      const paid = Store.paidAmountForOrder(o.id);
      const pending = pendingFor(o);
      return `
        <tr>
          <td class="cell-mono">${o.orderNo}</td>
          <td>${c ? `<a href="customer-detail.html?id=${c.id}" style="text-decoration:none;color:var(--text);font-weight:600;">${c.name}</a>` : '—'}</td>
          <td>${k ? k.name : '—'}</td>
          <td class="cell-mono cell-muted">${formatDateShort(o.assignedDate)}</td>
          <td class="cell-mono">${formatDateShort(o.deadline)}</td>
          <td class="cell-mono">${formatCurrency(o.totalAmount)}</td>
          <td class="cell-mono">${formatCurrency(paid)}</td>
          <td class="cell-mono ${pending > 0 ? 'balance-pending' : 'balance-paid'}">${pending > 0 ? formatCurrency(pending) : 'Paid'}</td>
          <td>
            <select class="status-select ${o.status}" data-id="${o.id}">
              <option value="progress" ${o.status==='progress'?'selected':''}>In Progress</option>
              <option value="ready" ${o.status==='ready'?'selected':''}>Ready</option>
              <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
            </select>
          </td>
          <td>
            <div class="row-actions">
              <button class="row-icon-btn" data-view="${o.id}" title="View order card">
                <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="row-icon-btn" data-pay="${o.id}" title="Add payment">${PAYMENT_ICON}</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    body.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const patch = { status: sel.value };
        if(sel.value === 'delivered') patch.deliveredDate = Date.now();
        Store.updateOrder(sel.getAttribute('data-id'), patch);
        sel.className = 'status-select ' + sel.value;
        showToast('Order status updated', 'success');
        render();
      });
    });
    body.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => openOrderCardModal(btn.getAttribute('data-view')));
    });
    body.querySelectorAll('[data-pay]').forEach(btn => {
      btn.addEventListener('click', () => openAddPaymentModal(btn.getAttribute('data-pay'), render));
    });
  }

  [fSearch, fStatus, fKarigar, fFrom, fTo, fSort].forEach(el => el.addEventListener('input', render));
  render();
})();
