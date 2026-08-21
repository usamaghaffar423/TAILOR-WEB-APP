/* ==========================================================================
   Top Man Tailor — dashboard.js
   All numbers computed live from localStorage via Store. Nothing hardcoded.
   ========================================================================== */

(function(){
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Cycles Morning → Afternoon → Evening → Night on its own as the day goes
  // by; re-checked every minute so a dashboard left open doesn't get stuck
  // on a stale greeting after crossing one of those boundaries.
  const greetingTitle = document.getElementById('greetingTitle');
  function renderGreeting(){
    greetingTitle.textContent = `${timeGreeting().toUpperCase()}, TOP MAN TAILOR HOUSE`;
  }
  renderGreeting();
  setInterval(renderGreeting, 60000);

  const orders = Store.getOrders();
  const customers = Store.getCustomers();
  const karigars = Store.getKarigars();
  const custById = Object.fromEntries(customers.map(c => [c.id, c]));
  const karById = Object.fromEntries(karigars.map(k => [k.id, k]));
  const WEEK = 7 * 86400000;
  const now = Date.now();

  function orderPending(o){
    const paid = Store.paidAmountForOrder(o.id);
    return Math.max(0, Number(o.totalAmount || 0) - paid);
  }

  // ---- KPI: Total Orders ----
  const totalOrders = orders.length;
  const newThisWeek = orders.filter(o => now - o.assignedDate <= WEEK && now - o.assignedDate >= 0).length;
  document.getElementById('kpiTotalOrders').textContent = totalOrders;
  document.getElementById('kpiTotalOrdersSub').innerHTML = `<b>+${newThisWeek}</b> this week`;

  // ---- KPI: In Progress ----
  const inProgress = orders.filter(o => o.status === 'progress');
  const progressKarigars = new Set(inProgress.map(o => o.karigarId)).size;
  document.getElementById('kpiInProgress').textContent = inProgress.length;
  document.getElementById('kpiInProgressSub').textContent = `across ${progressKarigars} karigar${progressKarigars === 1 ? '' : 's'}`;

  // ---- KPI: Due This Week ----
  const dueThisWeek = orders.filter(o => o.status !== 'delivered' && o.deadline - now <= WEEK && o.deadline - now >= 0);
  const dueTomorrow = dueThisWeek.filter(o => daysUntil(o.deadline) === 1).length;
  document.getElementById('kpiDueWeek').innerHTML = `${dueThisWeek.length} <span class="unit">orders</span>`;
  document.getElementById('kpiDueWeekSub').innerHTML = `<b>${dueTomorrow}</b> due tomorrow`;

  // ---- KPI: Pending Payments ----
  const pendingOrders = orders.map(o => ({ o, pending: orderPending(o) })).filter(x => x.pending > 0);
  const pendingTotal = pendingOrders.reduce((s, x) => s + x.pending, 0);
  document.getElementById('kpiPending').textContent = formatCurrency(pendingTotal);
  document.getElementById('kpiPendingSub').textContent = `across ${pendingOrders.length} order${pendingOrders.length === 1 ? '' : 's'}`;

  // ---- Recent Orders ----
  const recent = [...orders].sort((a, b) => b.assignedDate - a.assignedDate).slice(0, 5);
  const ordersListEl = document.getElementById('ordersList');
  if(recent.length === 0){
    ordersListEl.innerHTML = emptyStateHtml('No orders yet', 'Create your first order to see it here.');
  } else {
    ordersListEl.innerHTML = recent.map(o => {
      const cust = custById[o.customerId];
      const kar = karById[o.karigarId];
      return `
        <div class="order-row clickable" onclick="window.location.href='orders.html?q=${encodeURIComponent(o.orderNo)}'">
          <div class="order-avatar">${initials(cust ? cust.name : '?')}</div>
          <div class="order-info">
            <div class="order-name">${cust ? cust.name : 'Unknown Customer'}</div>
            <div class="order-meta">Assigned to ${kar ? kar.name : '—'}</div>
          </div>
          <div class="order-deadline">Deadline<b>${formatDateShort(o.deadline)}</b></div>
          <span class="badge ${STATUS_BADGE[o.status]}">${STATUS_LABEL[o.status]}</span>
        </div>`;
    }).join('');
  }

  // ---- Karigar Workload ----
  const karigarListEl = document.getElementById('karigarList');
  if(karigars.length === 0){
    karigarListEl.innerHTML = emptyStateHtml('No karigars yet');
  } else {
    karigarListEl.innerHTML = karigars.map(k => {
      const active = orders.filter(o => o.karigarId === k.id && o.status !== 'delivered').length;
      const pct = k.maxCapacity ? Math.min(100, Math.round(active / k.maxCapacity * 100)) : 0;
      return `
        <div class="karigar-row">
          <div class="karigar-top"><span class="karigar-name">${k.name}</span><span class="karigar-count">${active} active</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }

  // ---- Deadlines This Week ----
  const deadlineListEl = document.getElementById('deadlineList');
  const upcoming = orders
    .filter(o => o.status !== 'delivered' && o.deadline - now <= WEEK && o.deadline - now >= -WEEK)
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 6);
  if(upcoming.length === 0){
    deadlineListEl.innerHTML = emptyStateHtml('No deadlines this week');
  } else {
    deadlineListEl.innerHTML = upcoming.map(o => {
      const cust = custById[o.customerId];
      const kar = karById[o.karigarId];
      const d = new Date(o.deadline);
      return `
        <div class="deadline-item">
          <div class="deadline-day"><span class="d">${d.getDate()}</span><span class="m">${d.toLocaleDateString('en-GB',{month:'short'})}</span></div>
          <div class="deadline-info"><div class="n">${cust ? cust.name : 'Unknown'}</div><div class="k">${kar ? kar.name : '—'}</div></div>
        </div>`;
    }).join('');
  }
})();
