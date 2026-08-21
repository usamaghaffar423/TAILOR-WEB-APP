/* ==========================================================================
   Top Man Tailor — customer-detail.js
   Full profile, measurement templates, order history, print & WhatsApp share.
   ========================================================================== */

(function(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const customer = id ? Store.getCustomer(id) : null;

  if(!customer){
    document.querySelector('.content').innerHTML = emptyStateHtml('Customer not found', 'It may have been removed.');
    return;
  }

  document.getElementById('custName').textContent = customer.name.toUpperCase();
  document.getElementById('custSub').textContent = `${customer.customerId} · ${customer.phone}`;
  document.getElementById('btnNewOrderFor').href = 'new-order.html?customerId=' + encodeURIComponent(customer.id);

  const printBanner = document.getElementById('printBanner');
  if(printBanner){
    const shop = Store.getShop();
    printBanner.innerHTML = shop.banner ? `<img src="${shop.banner}" alt="${shop.name || 'Shop'} banner">` : '';
  }

  // EDIT_ICON and PAYMENT_ICON are defined once in shared.js and reused
  // across Orders/Customer Detail/Karigar Detail and the Order Card.

  // ---- Contact Info (view / edit) ----
  const contactInfoEl = document.getElementById('contactInfo');
  const contactEditActions = document.getElementById('contactEditActions');
  let contactEditing = false;

  function renderContactInfo(){
    if(contactEditing){
      contactInfoEl.innerHTML = `
        <div class="field"><label>Full Name</label><input type="text" id="editName" value="${customer.name}"></div>
        <div class="field"><label>Phone</label><input type="text" id="editPhone" value="${customer.phone}"></div>
        <div class="field span-2"><label>Address</label><input type="text" id="editAddress" value="${customer.address || ''}"></div>
        <div class="field"><label>Customer ID</label><input type="text" class="mono" value="${customer.customerId}" disabled></div>
        <div class="field"><label>Customer Since</label><input type="text" value="${formatDate(customer.createdAt)}" disabled></div>
      `;
      contactEditActions.style.display = 'flex';
    } else {
      contactInfoEl.innerHTML = `
        <div class="field"><label>Full Name</label><input type="text" value="${customer.name}" disabled></div>
        <div class="field"><label>Phone</label><input type="text" value="${customer.phone}" disabled></div>
        <div class="field span-2"><label>Address</label><input type="text" value="${customer.address || '—'}" disabled></div>
        <div class="field"><label>Customer ID</label><input type="text" class="mono" value="${customer.customerId}" disabled></div>
        <div class="field"><label>Customer Since</label><input type="text" value="${formatDate(customer.createdAt)}" disabled></div>
      `;
      contactEditActions.style.display = 'none';
    }
  }
  renderContactInfo();

  document.getElementById('btnEditContact').addEventListener('click', () => { contactEditing = true; renderContactInfo(); });
  document.getElementById('btnCancelContact').addEventListener('click', () => { contactEditing = false; renderContactInfo(); });
  document.getElementById('btnSaveContact').addEventListener('click', () => {
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const address = document.getElementById('editAddress').value.trim();
    if(!name || !phone){ showToast('Name and phone are required'); return; }
    Store.updateCustomer(customer.id, { name, phone, address });
    customer.name = name; customer.phone = phone; customer.address = address;
    document.getElementById('custName').textContent = customer.name.toUpperCase();
    document.getElementById('custSub').textContent = `${customer.customerId} · ${customer.phone}`;
    contactEditing = false;
    renderContactInfo();
    showToast('Customer profile updated', 'success');
  });

  // ---- Measurements (view / edit per template) ----
  // Read-only rendering reuses buildMeasurementBlockHtml, editing reuses
  // buildEditableMeasurementFieldsHtml — both from shared.js, the same
  // functions the Order Card and New Order page already use.
  const templates = Store.getTemplates();
  const measurements = Store.getMeasurementsForCustomer(customer.id);
  const measEl = document.getElementById('measurementList');
  const editingTemplates = new Set();

  function renderMeasurements(){
    if(measurements.length === 0){
      measEl.innerHTML = emptyStateHtml('No measurements saved', 'Measurements are captured when an order is created.');
      return;
    }
    measEl.innerHTML = measurements.map(m => {
      const tpl = templates[m.template] || { label: m.template };
      if(editingTemplates.has(m.template)){
        return `
          <div style="margin-bottom:18px;" data-template="${m.template}">
            <div style="font-size:13px;font-weight:700;margin-bottom:8px;">${tpl.label}</div>
            <div class="form-grid cols-4">${buildEditableMeasurementFieldsHtml(m.template, m.fields)}</div>
            <div class="field" style="margin-top:12px;"><label>Notes</label><textarea class="meas-edit-notes">${m.notes || ''}</textarea></div>
            <div class="hero-actions no-print" style="justify-content:flex-end;margin-top:12px;">
              <button class="btn btn-outline btn-sm meas-cancel" data-template="${m.template}">Cancel</button>
              <button class="btn btn-primary btn-sm meas-save" data-template="${m.template}">Save Measurements</button>
            </div>
          </div>`;
      }
      return `
        <div style="margin-bottom:18px;" data-template="${m.template}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="font-size:11px;color:var(--text-faint);font-weight:500;">Last updated ${formatDate(m.updatedAt)}</div>
            <button class="row-icon-btn no-print meas-edit" data-template="${m.template}" title="Edit ${tpl.label} measurements">${EDIT_ICON}</button>
          </div>
          ${buildMeasurementBlockHtml(m.template, m.fields, m.notes)}
        </div>`;
    }).join('');

    measEl.querySelectorAll('.meas-edit').forEach(btn => {
      btn.addEventListener('click', () => { editingTemplates.add(btn.getAttribute('data-template')); renderMeasurements(); });
    });
    measEl.querySelectorAll('.meas-cancel').forEach(btn => {
      btn.addEventListener('click', () => { editingTemplates.delete(btn.getAttribute('data-template')); renderMeasurements(); });
    });
    measEl.querySelectorAll('.meas-save').forEach(btn => {
      btn.addEventListener('click', () => {
        const tplKey = btn.getAttribute('data-template');
        const container = measEl.querySelector(`[data-template="${CSS.escape(tplKey)}"]`);
        const fields = {};
        container.querySelectorAll('input[data-key]').forEach(inp => { fields[inp.getAttribute('data-key')] = inp.value.trim(); });
        const notes = container.querySelector('.meas-edit-notes').value.trim();
        const updated = { customerId: customer.id, template: tplKey, fields, notes, updatedAt: Date.now() };
        Store.upsertMeasurement(updated);
        const idx = measurements.findIndex(x => x.template === tplKey);
        if(idx !== -1) measurements[idx] = updated;
        editingTemplates.delete(tplKey);
        renderMeasurements();
        showToast('Measurements updated', 'success');
      });
    });
  }
  renderMeasurements();

  const orders = Store.ordersForCustomer(customer.id).sort((a, b) => b.assignedDate - a.assignedDate);
  const karById = Object.fromEntries(Store.getKarigars().map(k => [k.id, k]));
  const historyEl = document.getElementById('orderHistory');

  // Re-run after any payment is recorded (or an order edited) so the row's
  // balance and the Summary panel (Total Spent / Pending Balance) both stay
  // in sync — customers routinely pay partially at order time and the rest
  // later, so this needs to be easy to re-trigger, not a one-shot render.
  function renderOrderHistoryAndSummary(){
    if(orders.length === 0){
      historyEl.innerHTML = emptyStateHtml('No orders yet', 'Create the first order for this customer.');
    } else {
      historyEl.innerHTML = orders.map(o => {
        const kar = karById[o.karigarId];
        const paid = Store.paidAmountForOrder(o.id);
        const pending = Math.max(0, o.totalAmount - paid);
        return `
          <div class="order-row clickable" onclick="window.location.href='orders.html?q=${encodeURIComponent(o.orderNo)}'">
            <div class="order-avatar mono">${o.orderNo.replace('ORD-','#')}</div>
            <div class="order-info">
              <div class="order-name">${formatCurrency(o.totalAmount)} total</div>
              <div class="order-meta">${kar ? kar.name : '—'} · ${pending > 0 ? formatCurrency(pending) + ' pending' : 'Paid in full'}</div>
            </div>
            <div class="order-deadline">Deadline<b>${formatDateShort(o.deadline)}</b></div>
            <span class="badge ${STATUS_BADGE[o.status]}">${STATUS_LABEL[o.status]}</span>
            <div class="row-actions">
              <button class="row-icon-btn" title="View order card" onclick="event.stopPropagation(); openOrderCardModal('${o.id}')">
                <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="row-icon-btn" title="Add payment" data-pay="${o.id}" onclick="event.stopPropagation();">${PAYMENT_ICON}</button>
              <button class="row-icon-btn" title="Send order to customer on WhatsApp" onclick="event.stopPropagation(); sendOrderWhatsApp(Store.getOrder('${o.id}'), 'customer')">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5 0-.1-.6-1.5-.9-2-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.3-.1-.1-.3-.2-.5-.3z"/><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
              </button>
            </div>
          </div>`;
      }).join('');
      historyEl.querySelectorAll('[data-pay]').forEach(btn => {
        btn.addEventListener('click', () => openAddPaymentModal(btn.getAttribute('data-pay'), renderOrderHistoryAndSummary));
      });
    }

    const totalSpent = orders.reduce((s, o) => s + Store.paidAmountForOrder(o.id), 0);
    const totalPending = orders.reduce((s, o) => s + Math.max(0, o.totalAmount - Store.paidAmountForOrder(o.id)), 0);
    document.getElementById('sumSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('sumPending').textContent = formatCurrency(totalPending);
    document.getElementById('sumPending').style.color = totalPending > 0 ? 'var(--red-bright)' : 'var(--green)';
    document.getElementById('sumOrders').textContent = orders.length;
  }
  renderOrderHistoryAndSummary();

  // ---- Print ----
  document.getElementById('btnPrint').addEventListener('click', () => window.print());

  // ---- WhatsApp share ----
  document.getElementById('btnWhatsapp').addEventListener('click', () => {
    let text = `Measurement Summary — ${customer.name} (${customer.customerId})\n`;
    if(measurements.length === 0){
      text += 'No measurements on file yet.';
    } else {
      measurements.forEach(m => {
        const tpl = templates[m.template] || { label: m.template, fields: [] };
        text += `\n${tpl.label}:\n`;
        tpl.fields.forEach(f => {
          text += `${f.label}: ${(m.fields && m.fields[f.key]) || '—'}\n`;
        });
      });
    }
    text += `\n— Top Man Tailor`;
    const phoneDigits = (customer.phone || '').replace(/[^\d]/g, '');
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });
})();
