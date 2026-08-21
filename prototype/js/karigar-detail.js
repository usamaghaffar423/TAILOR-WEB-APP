/* ==========================================================================
   Top Man Tailor — karigar-detail.js
   All orders assigned to a karigar, filterable by month & status.
   ========================================================================== */

(function(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const karigar = id ? Store.getKarigar(id) : null;

  if(!karigar){
    document.querySelector('.content').innerHTML = emptyStateHtml('Karigar not found', 'It may have been removed.');
    return;
  }

  function renderKarigarHeader(){
    document.getElementById('karName').textContent = karigar.name.toUpperCase();
    document.getElementById('karSub').textContent = `${karigar.speciality || '—'} · ${karigar.phone || '—'}`;
    document.getElementById('kActSub').textContent = `of ${karigar.maxCapacity || '—'} capacity`;
  }
  renderKarigarHeader();

  const orders = Store.ordersForKarigar(karigar.id);
  const custById = Object.fromEntries(Store.getCustomers().map(c => [c.id, c]));

  const active = orders.filter(o => o.status !== 'delivered').length;
  const delivered = orders.filter(o => o.status === 'delivered');
  const rated = delivered.filter(o => o.deliveredDate);
  const onTime = rated.filter(o => o.deliveredDate <= o.deadline).length;
  document.getElementById('kAct').textContent = active;
  document.getElementById('kTotal').textContent = orders.length;
  document.getElementById('kDelivered').textContent = delivered.length;
  document.getElementById('kRate').textContent = rated.length ? Math.round(onTime / rated.length * 100) + '%' : '—';

  // ---- Edit Karigar ----
  document.getElementById('btnEditKarigar').addEventListener('click', () => {
    document.getElementById('ekName').value = karigar.name;
    document.getElementById('ekPhone').value = karigar.phone || '';
    document.getElementById('ekSpeciality').value = karigar.speciality || '';
    document.getElementById('ekCapacity').value = karigar.maxCapacity || '';
    openModal('modalEditKarigar');
  });
  document.getElementById('ekSave').addEventListener('click', () => {
    const name = document.getElementById('ekName').value.trim();
    if(!name){ showToast('Name is required'); return; }
    const patch = {
      name,
      phone: document.getElementById('ekPhone').value.trim(),
      speciality: document.getElementById('ekSpeciality').value.trim(),
      maxCapacity: parseInt(document.getElementById('ekCapacity').value, 10) || karigar.maxCapacity
    };
    Store.updateKarigar(karigar.id, patch);
    Object.assign(karigar, patch);
    renderKarigarHeader();
    closeModal('modalEditKarigar');
    showToast('Karigar updated', 'success');
  });

  // month filter options
  const months = [...new Set(orders.map(o => {
    const d = new Date(o.assignedDate);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }))].sort().reverse();
  const fMonth = document.getElementById('fMonth');
  fMonth.innerHTML += months.map(m => {
    const [y, mo] = m.split('-');
    const label = new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    return `<option value="${m}">${label}</option>`;
  }).join('');
  const fStatus = document.getElementById('fStatus');

  const body = document.getElementById('karOrders');
  const emptyEl = document.getElementById('karOrdersEmpty');

  function render(){
    let list = [...orders].sort((a, b) => b.assignedDate - a.assignedDate);
    if(fMonth.value){
      list = list.filter(o => {
        const d = new Date(o.assignedDate);
        return fMonth.value === d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      });
    }
    if(fStatus.value) list = list.filter(o => o.status === fStatus.value);

    if(list.length === 0){
      body.innerHTML = '';
      emptyEl.innerHTML = emptyStateHtml('No orders found', 'Try a different filter.');
      return;
    }
    emptyEl.innerHTML = '';
    body.innerHTML = list.map(o => {
      const c = custById[o.customerId];
      return `
        <tr class="clickable" onclick="window.location.href='orders.html?q=${encodeURIComponent(o.orderNo)}'">
          <td class="cell-mono">${o.orderNo}</td>
          <td>${c ? c.name : '—'}</td>
          <td class="cell-mono cell-muted">${formatDateShort(o.assignedDate)}</td>
          <td class="cell-mono">${formatDateShort(o.deadline)}</td>
          <td><span class="badge ${STATUS_BADGE[o.status]}">${STATUS_LABEL[o.status]}</span></td>
          <td>
            <div class="row-actions">
              <button class="row-icon-btn" data-act="view" data-id="${o.id}" title="View order card">
                <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="row-icon-btn" data-act="whatsapp" data-id="${o.id}" title="Send order to karigar on WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5 0-.1-.6-1.5-.9-2-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.3-.1-.1-.3-.2-.5-.3z"/><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
              </button>
              <button class="row-icon-btn" data-act="pay" data-id="${o.id}" title="Add payment">${PAYMENT_ICON}</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    body.querySelectorAll('[data-act="view"]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openOrderCardModal(btn.getAttribute('data-id')); });
    });
    body.querySelectorAll('[data-act="whatsapp"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const order = Store.getOrder(btn.getAttribute('data-id'));
        if(order) sendOrderWhatsApp(order, 'karigar');
      });
    });
    body.querySelectorAll('[data-act="pay"]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openAddPaymentModal(btn.getAttribute('data-id'), render); });
    });
  }

  fMonth.addEventListener('change', render);
  fStatus.addEventListener('change', render);
  render();
})();
