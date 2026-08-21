/* ==========================================================================
   Top Man Tailor — payments.js
   Full payment ledger, per-order balances, add-payment with order picker.
   ========================================================================== */

(function(){
  const custById = () => Object.fromEntries(Store.getCustomers().map(c => [c.id, c]));
  const orderById = () => Object.fromEntries(Store.getOrders().map(o => [o.id, o]));
  const METHOD_LABEL = { cash: 'Cash', easypaisa: 'Easypaisa', jazzcash: 'JazzCash', bank: 'Bank' };

  const fSearch = document.getElementById('fSearch');
  const fMethod = document.getElementById('fMethod');
  const fFrom = document.getElementById('fFrom');
  const fTo = document.getElementById('fTo');
  const body = document.getElementById('payBody');
  const emptyEl = document.getElementById('payEmpty');
  const countEl = document.getElementById('payCount');
  const balBody = document.getElementById('balBody');

  function renderKpis(){
    const payments = Store.getPayments();
    const now = new Date();
    const weekAgo = Date.now() - 7 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const incWeek = payments.filter(p => p.date >= weekAgo).reduce((s, p) => s + Number(p.amount || 0), 0);
    const incMonth = payments.filter(p => p.date >= monthStart).reduce((s, p) => s + Number(p.amount || 0), 0);
    const orders = Store.getOrders();
    const totalPending = orders.reduce((s, o) => s + Math.max(0, Number(o.totalAmount || 0) - Store.paidAmountForOrder(o.id)), 0);
    document.getElementById('incWeek').textContent = formatCurrency(incWeek);
    document.getElementById('incMonth').textContent = formatCurrency(incMonth);
    document.getElementById('incPending').textContent = formatCurrency(totalPending);
  }

  function renderTable(){
    const cust = custById();
    const ord = orderById();
    let payments = Store.getPayments();

    const q = fSearch.value.trim().toLowerCase();
    if(q){
      payments = payments.filter(p => {
        const o = ord[p.orderId];
        const c = o ? cust[o.customerId] : null;
        return (o && o.orderNo.toLowerCase().includes(q)) || (c && c.name.toLowerCase().includes(q));
      });
    }
    if(fMethod.value) payments = payments.filter(p => p.method === fMethod.value);
    if(fFrom.value){ const t = new Date(fFrom.value).setHours(0,0,0,0); payments = payments.filter(p => p.date >= t); }
    if(fTo.value){ const t = new Date(fTo.value).setHours(23,59,59,999); payments = payments.filter(p => p.date <= t); }

    payments.sort((a, b) => b.date - a.date);
    countEl.textContent = payments.length + ' payment' + (payments.length === 1 ? '' : 's');

    if(payments.length === 0){
      body.innerHTML = '';
      emptyEl.innerHTML = emptyStateHtml('No payments found', 'Try adjusting your search or filters.');
      return;
    }
    emptyEl.innerHTML = '';
    body.innerHTML = payments.map(p => {
      const o = ord[p.orderId];
      const c = o ? cust[o.customerId] : null;
      return `
        <tr>
          <td class="cell-mono cell-muted">${formatDateShort(p.date)}</td>
          <td>${c ? c.name : '—'}</td>
          <td class="cell-mono">${o ? o.orderNo : '—'}</td>
          <td class="cell-mono">${formatCurrency(p.amount)}</td>
          <td>${METHOD_LABEL[p.method] || p.method}</td>
          <td class="cell-muted">${p.note || '—'}</td>
        </tr>`;
    }).join('');
  }

  function renderBalances(){
    const cust = custById();
    const orders = [...Store.getOrders()].sort((a, b) => b.assignedDate - a.assignedDate);
    if(orders.length === 0){
      balBody.innerHTML = `<tr><td colspan="5">${emptyStateHtml('No orders yet')}</td></tr>`;
      return;
    }
    balBody.innerHTML = orders.map(o => {
      const c = cust[o.customerId];
      const paid = Store.paidAmountForOrder(o.id);
      const pending = Math.max(0, o.totalAmount - paid);
      return `
        <tr>
          <td class="cell-mono">${o.orderNo}</td>
          <td>${c ? c.name : '—'}</td>
          <td class="cell-mono">${formatCurrency(o.totalAmount)}</td>
          <td class="cell-mono">${formatCurrency(paid)}</td>
          <td class="cell-mono ${pending > 0 ? 'balance-pending' : 'balance-paid'}">${pending > 0 ? formatCurrency(pending) : 'Paid'}</td>
        </tr>`;
    }).join('');
  }

  function renderAll(){ renderKpis(); renderTable(); renderBalances(); }
  [fSearch, fMethod, fFrom, fTo].forEach(el => el.addEventListener('input', renderTable));
  renderAll();

  // ---- Add Payment modal ----
  let selectedOrderId = null;
  const npOrderSearch = document.getElementById('npOrderSearch');
  const npOrderResults = document.getElementById('npOrderResults');
  const npOrderSelected = document.getElementById('npOrderSelected');

  npOrderSearch.addEventListener('input', () => {
    const q = npOrderSearch.value.trim().toLowerCase();
    selectedOrderId = null;
    npOrderSelected.textContent = '';
    if(!q){ npOrderResults.style.display = 'none'; npOrderResults.innerHTML = ''; return; }
    const cust = custById();
    const matches = Store.getOrders().filter(o => {
      const c = cust[o.customerId];
      return o.orderNo.toLowerCase().includes(q) || (c && c.name.toLowerCase().includes(q));
    }).slice(0, 8);
    if(matches.length === 0){
      npOrderResults.style.display = 'block';
      npOrderResults.innerHTML = `<div style="padding:10px 12px;font-size:12px;color:var(--text-faint);">No orders found</div>`;
      return;
    }
    npOrderResults.style.display = 'block';
    npOrderResults.innerHTML = matches.map(o => {
      const c = cust[o.customerId];
      const pending = Math.max(0, o.totalAmount - Store.paidAmountForOrder(o.id));
      return `<div class="np-result" data-id="${o.id}" style="padding:10px 12px;font-size:12.5px;cursor:pointer;border-bottom:1px solid var(--border);">
        <b>${o.orderNo}</b> — ${c ? c.name : '—'} <span style="color:var(--text-faint);">(${formatCurrency(pending)} pending)</span>
      </div>`;
    }).join('');
    npOrderResults.querySelectorAll('.np-result').forEach(el => {
      el.addEventListener('click', () => {
        selectedOrderId = el.getAttribute('data-id');
        const o = Store.getOrder(selectedOrderId);
        const c = cust[o.customerId];
        npOrderSearch.value = `${o.orderNo} — ${c ? c.name : ''}`;
        npOrderSelected.textContent = 'Selected: ' + o.orderNo;
        npOrderResults.style.display = 'none';
      });
    });
  });

  document.getElementById('btnAddPayment').addEventListener('click', () => {
    selectedOrderId = null;
    npOrderSearch.value = '';
    npOrderSelected.textContent = '';
    document.getElementById('npAmount').value = '';
    document.getElementById('npNote').value = '';
    openModal('modalAddPayment');
  });

  document.getElementById('npSave').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('npAmount').value);
    if(!selectedOrderId){ showToast('Please select an order'); return; }
    if(!amount || amount <= 0){ showToast('Enter a valid amount'); return; }
    Store.addPayment({
      id: Store.uid('pay'),
      orderId: selectedOrderId,
      amount,
      method: document.getElementById('npMethod').value,
      date: Date.now(),
      note: document.getElementById('npNote').value.trim()
    });
    closeModal('modalAddPayment');
    showToast('Payment recorded', 'success');
    renderAll();
  });
})();
