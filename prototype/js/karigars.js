/* ==========================================================================
   Top Man Tailor — karigars.js
   Karigar cards: active load vs capacity, on-time delivery rate, add karigar.
   ========================================================================== */

(function(){
  const fSearch = document.getElementById('fSearch');
  const grid = document.getElementById('karGrid');
  const emptyEl = document.getElementById('karEmpty');
  const countEl = document.getElementById('karCount');

  function stats(karigarId){
    const orders = Store.ordersForKarigar(karigarId);
    const active = orders.filter(o => o.status !== 'delivered').length;
    const delivered = orders.filter(o => o.status === 'delivered' && o.deliveredDate);
    const onTimeCount = delivered.filter(o => o.deliveredDate <= o.deadline).length;
    const rate = delivered.length ? Math.round(onTimeCount / delivered.length * 100) : null;
    return { active, total: orders.length, deliveredCount: delivered.length, rate };
  }

  function render(){
    let karigars = Store.getKarigars();
    const q = fSearch.value.trim().toLowerCase();
    if(q){
      karigars = karigars.filter(k => k.name.toLowerCase().includes(q) || (k.speciality || '').toLowerCase().includes(q));
    }
    countEl.textContent = karigars.length + ' karigar' + (karigars.length === 1 ? '' : 's');

    if(karigars.length === 0){
      grid.innerHTML = '';
      emptyEl.innerHTML = emptyStateHtml('No karigars found', 'Try a different search, or add a new karigar.');
      return;
    }
    emptyEl.innerHTML = '';
    grid.innerHTML = karigars.map(k => {
      const s = stats(k.id);
      const pct = k.maxCapacity ? Math.min(100, Math.round(s.active / k.maxCapacity * 100)) : 0;
      return `
        <div class="entity-card" onclick="window.location.href='karigar-detail.html?id=${k.id}'">
          <div class="entity-card-top">
            <div class="entity-card-avatar">${initials(k.name)}</div>
            <div>
              <div class="entity-card-name">${k.name}</div>
              <div class="entity-card-sub">${k.speciality || '—'} · ${k.phone || '—'}</div>
            </div>
          </div>
          <div style="margin-top:12px;">
            <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-faint);margin-bottom:6px;">
              <span>${s.active} / ${k.maxCapacity || '—'} active</span>
              <span>${s.rate === null ? 'No delivery data' : s.rate + '% on-time'}</span>
            </div>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          </div>
        </div>`;
    }).join('');
  }

  fSearch.addEventListener('input', render);
  render();

  document.getElementById('btnAddKarigar').addEventListener('click', () => openModal('modalAddKarigar'));
  document.getElementById('nkSave').addEventListener('click', () => {
    const name = document.getElementById('nkName').value.trim();
    const phone = document.getElementById('nkPhone').value.trim();
    const speciality = document.getElementById('nkSpeciality').value.trim();
    const capacity = parseInt(document.getElementById('nkCapacity').value, 10) || 6;
    if(!name){ showToast('Name is required'); return; }
    Store.addKarigar({ id: Store.uid('kar'), name, phone, speciality, maxCapacity: capacity });
    document.getElementById('nkName').value = '';
    document.getElementById('nkPhone').value = '';
    document.getElementById('nkSpeciality').value = '';
    document.getElementById('nkCapacity').value = '';
    closeModal('modalAddKarigar');
    showToast('Karigar added', 'success');
    render();
  });
})();
