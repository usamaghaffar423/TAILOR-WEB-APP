/* ==========================================================================
   Top Man Tailor — store.js
   Thin get/set helpers over localStorage. No backend — every collection is
   just a JSON array (or object) under its own key. Production build will
   replace this file with real API calls behind the same function names.
   ========================================================================== */

const STORE_KEYS = {
  customers: 'tmt_customers',
  measurements: 'tmt_measurements',
  orders: 'tmt_orders',
  payments: 'tmt_payments',
  karigars: 'tmt_karigars',
  templates: 'tmt_templates',
  templateVersion: 'tmt_template_version',
  shop: 'tmt_shop',
  seeded: 'tmt_seeded'
};

function storeGet(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(raw === null) return fallback;
    return JSON.parse(raw);
  }catch(e){
    console.error('store: failed to read', key, e);
    return fallback;
  }
}
function storeSet(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

const Store = {
  // ---- customers ----
  getCustomers(){ return storeGet(STORE_KEYS.customers, []); },
  saveCustomers(list){ storeSet(STORE_KEYS.customers, list); },
  getCustomer(id){ return this.getCustomers().find(c => c.id === id) || null; },
  addCustomer(customer){
    const list = this.getCustomers();
    list.push(customer);
    this.saveCustomers(list);
    return customer;
  },
  updateCustomer(id, patch){
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === id);
    if(idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], patch);
    this.saveCustomers(list);
    return list[idx];
  },
  nextCustomerCode(){
    const list = this.getCustomers();
    let max = 0;
    list.forEach(c => {
      const m = /TMT-(\d+)/.exec(c.customerId || '');
      if(m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'TMT-' + String(max + 1).padStart(3, '0');
  },

  // ---- measurements ----
  getMeasurements(){ return storeGet(STORE_KEYS.measurements, []); },
  saveMeasurements(list){ storeSet(STORE_KEYS.measurements, list); },
  getMeasurementsForCustomer(customerId){
    return this.getMeasurements().filter(m => m.customerId === customerId);
  },
  upsertMeasurement(entry){
    const list = this.getMeasurements();
    const idx = list.findIndex(m => m.customerId === entry.customerId && m.template === entry.template);
    if(idx === -1) list.push(entry);
    else list[idx] = entry;
    this.saveMeasurements(list);
    return entry;
  },

  // ---- orders ----
  getOrders(){ return storeGet(STORE_KEYS.orders, []); },
  saveOrders(list){ storeSet(STORE_KEYS.orders, list); },
  getOrder(id){ return this.getOrders().find(o => o.id === id) || null; },
  addOrder(order){
    const list = this.getOrders();
    list.push(order);
    this.saveOrders(list);
    return order;
  },
  updateOrder(id, patch){
    const list = this.getOrders();
    const idx = list.findIndex(o => o.id === id);
    if(idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], patch);
    this.saveOrders(list);
    return list[idx];
  },
  nextOrderNo(){
    const list = this.getOrders();
    let max = 0;
    list.forEach(o => {
      const m = /ORD-(\d+)/.exec(o.orderNo || '');
      if(m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'ORD-' + String(max + 1).padStart(4, '0');
  },
  ordersForCustomer(customerId){ return this.getOrders().filter(o => o.customerId === customerId); },
  ordersForKarigar(karigarId){ return this.getOrders().filter(o => o.karigarId === karigarId); },

  // ---- payments ----
  getPayments(){ return storeGet(STORE_KEYS.payments, []); },
  savePayments(list){ storeSet(STORE_KEYS.payments, list); },
  addPayment(payment){
    const list = this.getPayments();
    list.push(payment);
    this.savePayments(list);
    return payment;
  },
  paymentsForOrder(orderId){ return this.getPayments().filter(p => p.orderId === orderId); },
  paidAmountForOrder(orderId){
    return this.paymentsForOrder(orderId).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  },

  // ---- karigars ----
  getKarigars(){ return storeGet(STORE_KEYS.karigars, []); },
  saveKarigars(list){ storeSet(STORE_KEYS.karigars, list); },
  getKarigar(id){ return this.getKarigars().find(k => k.id === id) || null; },
  addKarigar(karigar){
    const list = this.getKarigars();
    list.push(karigar);
    this.saveKarigars(list);
    return karigar;
  },
  updateKarigar(id, patch){
    const list = this.getKarigars();
    const idx = list.findIndex(k => k.id === id);
    if(idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], patch);
    this.saveKarigars(list);
    return list[idx];
  },

  // ---- templates (measurement field definitions, editable in Settings) ----
  getTemplates(){ return storeGet(STORE_KEYS.templates, {}); },
  saveTemplates(t){ storeSet(STORE_KEYS.templates, t); },

  // ---- shop settings ----
  getShop(){ return storeGet(STORE_KEYS.shop, {}); },
  saveShop(s){ storeSet(STORE_KEYS.shop, s); },

  // ---- ids ----
  uid(prefix){ return (prefix ? prefix + '_' : '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
};
