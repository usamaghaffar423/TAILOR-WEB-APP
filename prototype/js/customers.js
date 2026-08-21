/* ==========================================================================
   Top Man Tailor — customers.js
   Searchable customer grid + add-customer modal.
   ========================================================================== */

(function(){
  const fSearch = document.getElementById('fSearch');
  const grid = document.getElementById('custGrid');
  const emptyEl = document.getElementById('custEmpty');
  const countEl = document.getElementById('custCount');

  function customerStats(customerId){
    const orders = Store.ordersForCustomer(customerId);
    const last = orders.reduce((max, o) => Math.max(max, o.assignedDate || 0), 0);
    return { totalOrders: orders.length, lastOrder: last };
  }

  function render(){
    let customers = Store.getCustomers();
    const q = fSearch.value.trim().toLowerCase();
    if(q){
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.customerId || '').toLowerCase().includes(q)
      );
    }
    customers = [...customers].sort((a, b) => b.createdAt - a.createdAt);
    countEl.textContent = customers.length + ' customer' + (customers.length === 1 ? '' : 's');

    if(customers.length === 0){
      grid.innerHTML = '';
      emptyEl.innerHTML = emptyStateHtml('No customers found', 'Try a different search, or add a new customer.');
      return;
    }
    emptyEl.innerHTML = '';
    grid.innerHTML = customers.map(c => {
      const stats = customerStats(c.id);
      return `
        <div class="entity-card" onclick="window.location.href='customer-detail.html?id=${c.id}'">
          <div class="entity-card-top">
            <div class="entity-card-avatar">${initials(c.name)}</div>
            <div>
              <div class="entity-card-name">${c.name}</div>
              <div class="entity-card-sub">${c.customerId} · ${c.phone}</div>
            </div>
          </div>
          <div class="entity-card-stats">
            <div class="entity-stat"><div class="v">${stats.totalOrders}</div><div class="l">Orders</div></div>
            <div class="entity-stat"><div class="v">${stats.lastOrder ? formatDateShort(stats.lastOrder) : '—'}</div><div class="l">Last Order</div></div>
          </div>
        </div>`;
    }).join('');
  }

  fSearch.addEventListener('input', render);
  render();

  // ---- Add Customer modal ----
  document.getElementById('btnAddCustomer').addEventListener('click', () => openModal('modalAddCustomer'));
  document.getElementById('ncSave').addEventListener('click', () => {
    const name = document.getElementById('ncName').value.trim();
    const phone = document.getElementById('ncPhone').value.trim();
    const address = document.getElementById('ncAddress').value.trim();
    if(!name || !phone){
      showToast('Name and phone are required');
      return;
    }
    const customer = {
      id: Store.uid('cus'),
      customerId: Store.nextCustomerCode(),
      name, phone, address,
      createdAt: Date.now()
    };
    Store.addCustomer(customer);
    document.getElementById('ncName').value = '';
    document.getElementById('ncPhone').value = '';
    document.getElementById('ncAddress').value = '';
    closeModal('modalAddCustomer');
    showToast('Customer added', 'success');
    render();
  });
})();
