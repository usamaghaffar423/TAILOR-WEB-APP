/* ==========================================================================
   Top Man Tailor — seed.js
   Populates localStorage with realistic dummy data on first load only.
   Also defines the default measurement-template field sets (editable later
   from settings.html, stored under STORE_KEYS.templates).
   ========================================================================== */

// Template field set is versioned so that a browser that already ran the
// one-time seed still picks up new/renamed measurement fields on load
// (see TEMPLATE_VERSION below) without wiping customers/orders/payments.
// v3 (2026-08): comprehensive Pukhtoon/Punjabi Shalwar Qameez measurement
// set — core fields stay visible, `advanced: true` fields are tucked under
// the "Advanced Measurements" disclosure (see buildMeasurementBlockHtml).
const TEMPLATE_VERSION = 3;

const DEFAULT_TEMPLATES = {
  'shalwar-kameez-men': {
    label: "Men's Shalwar Kameez",
    fields: [
      // Qameez — core
      { key: 'qlength', label: 'Qameez Length', group: 'Qameez' },
      { key: 'chest', label: 'Chest', group: 'Qameez' },
      { key: 'waist', label: 'Waist', group: 'Qameez' },
      { key: 'qSeat', label: 'Hip / Seat', group: 'Qameez' },
      { key: 'shoulder', label: 'Kandha (Shoulder)', group: 'Qameez' },
      { key: 'sleeve', label: 'Sleeve Length', group: 'Qameez' },
      { key: 'bazu', label: 'Bazu (Upper Arm)', group: 'Qameez' },
      { key: 'armhole', label: 'Armhole', group: 'Qameez' },
      { key: 'cuff', label: 'Wrist / Cuff', group: 'Qameez' },
      { key: 'neck', label: 'Gala (Neck)', group: 'Qameez' },
      // Qameez — advanced
      { key: 'frontLength', label: 'Front Length', group: 'Qameez', advanced: true },
      { key: 'backLength', label: 'Back Length', group: 'Qameez', advanced: true },
      { key: 'bicep', label: 'Bicep', group: 'Qameez', advanced: true },
      { key: 'elbow', label: 'Elbow', group: 'Qameez', advanced: true },
      { key: 'cuffOpening', label: 'Cuff Opening', group: 'Qameez', advanced: true },
      // Shalwar — core
      { key: 'slength', label: 'Shalwar Length', group: 'Shalwar' },
      { key: 'shalwarWaist', label: 'Waist', group: 'Shalwar' },
      { key: 'seat', label: 'Hip / Seat', group: 'Shalwar' },
      { key: 'shalwarWidth', label: 'Shalwar Width', group: 'Shalwar' },
      { key: 'mori', label: 'Mori / Pauncha (Bottom Opening)', group: 'Shalwar' },
      // Shalwar — advanced
      { key: 'thigh', label: 'Thigh', group: 'Shalwar', advanced: true },
      { key: 'knee', label: 'Knee', group: 'Shalwar', advanced: true },
      { key: 'pocketDepthMeas', label: 'Pocket Depth', group: 'Shalwar', advanced: true },
      { key: 'waistbandHeight', label: 'Waistband Height', group: 'Shalwar', advanced: true }
    ]
  },
  'shalwar-kameez-women': {
    label: "Women's Shalwar Kameez",
    fields: [
      // Qameez — core
      { key: 'qlength', label: 'Qameez Length', group: 'Qameez' },
      { key: 'chest', label: 'Chest / Bust', group: 'Qameez' },
      { key: 'waist', label: 'Waist', group: 'Qameez' },
      { key: 'qSeat', label: 'Hip / Seat', group: 'Qameez' },
      { key: 'shoulder', label: 'Kandha (Shoulder)', group: 'Qameez' },
      { key: 'sleeve', label: 'Sleeve Length', group: 'Qameez' },
      { key: 'bazu', label: 'Bazu (Upper Arm)', group: 'Qameez' },
      { key: 'armhole', label: 'Armhole', group: 'Qameez' },
      { key: 'cuff', label: 'Wrist / Cuff', group: 'Qameez' },
      { key: 'neck', label: 'Gala (Neck)', group: 'Qameez' },
      // Qameez — advanced
      { key: 'frontLength', label: 'Front Length', group: 'Qameez', advanced: true },
      { key: 'backLength', label: 'Back Length', group: 'Qameez', advanced: true },
      { key: 'bicep', label: 'Bicep', group: 'Qameez', advanced: true },
      { key: 'elbow', label: 'Elbow', group: 'Qameez', advanced: true },
      { key: 'ghera', label: 'Ghera (Flare / Bottom Width)', group: 'Qameez', advanced: true },
      // Shalwar — core
      { key: 'slength', label: 'Shalwar Length', group: 'Shalwar' },
      { key: 'shalwarWaist', label: 'Waist', group: 'Shalwar' },
      { key: 'seat', label: 'Hip / Seat', group: 'Shalwar' },
      { key: 'shalwarWidth', label: 'Shalwar Width', group: 'Shalwar' },
      { key: 'mori', label: 'Mori / Pauncha (Bottom Opening)', group: 'Shalwar' },
      // Shalwar — advanced
      { key: 'thigh', label: 'Thigh', group: 'Shalwar', advanced: true },
      { key: 'knee', label: 'Knee', group: 'Shalwar', advanced: true },
      { key: 'pocketDepthMeas', label: 'Pocket Depth', group: 'Shalwar', advanced: true },
      { key: 'waistbandHeight', label: 'Waistband Height', group: 'Shalwar', advanced: true }
    ]
  },
  'pant-shirt': {
    label: 'Pant & Shirt',
    fields: [
      { key: 'slength', label: 'Shirt Length' },
      { key: 'shoulder', label: 'Shoulder' },
      { key: 'chest', label: 'Chest' },
      { key: 'sleeve', label: 'Sleeve' },
      { key: 'collar', label: 'Collar' },
      { key: 'waist', label: 'Waist' },
      { key: 'plength', label: 'Pant Length' },
      { key: 'inseam', label: 'Inseam' }
    ]
  },
  'coat': {
    label: 'Coat',
    fields: [
      { key: 'clength', label: 'Coat Length' },
      { key: 'shoulder', label: 'Shoulder' },
      { key: 'chest', label: 'Chest' },
      { key: 'waist', label: 'Waist' },
      { key: 'sleeve', label: 'Sleeve' },
      { key: 'collar', label: 'Collar' }
    ]
  },
  'waistcoat': {
    label: 'Waistcoat',
    fields: [
      { key: 'wlength', label: 'Waistcoat Length' },
      { key: 'shoulder', label: 'Shoulder' },
      { key: 'chest', label: 'Chest' },
      { key: 'waist', label: 'Waist' }
    ]
  },
  'thobe': {
    label: 'Thobe',
    fields: [
      { key: 'tlength', label: 'Thobe Length' },
      { key: 'shoulder', label: 'Shoulder' },
      { key: 'chest', label: 'Chest' },
      { key: 'sleeve', label: 'Sleeve' },
      { key: 'neck', label: 'Neck' },
      { key: 'bottom', label: 'Bottom' }
    ]
  }
};

// Keeps localStorage's measurement templates in sync with DEFAULT_TEMPLATES
// whenever TEMPLATE_VERSION is bumped, even on a browser that already
// completed the one-time seed — so new/renamed fields still show up.
function syncTemplates(){
  const storedVersion = parseInt(localStorage.getItem(STORE_KEYS.templateVersion) || '0', 10);
  if(storedVersion < TEMPLATE_VERSION){
    Store.saveTemplates(DEFAULT_TEMPLATES);
    localStorage.setItem(STORE_KEYS.templateVersion, String(TEMPLATE_VERSION));
  }
}

function seedRun(){
  syncTemplates();
  if(localStorage.getItem(STORE_KEYS.seeded)) return;

  // ---- shop ----
  Store.saveShop({
    name: 'Top Man Tailor',
    address: 'Shop 14, Textile Market, Faisalabad',
    phone: '+92 300 1234567',
    themeDefault: 'dark'
  });

  // ---- karigars ----
  const karigars = [
    { id: 'k1', name: 'Rasheed Khan', phone: '+92 301 2223344', speciality: 'Shalwar Kameez', maxCapacity: 8 },
    { id: 'k2', name: 'Farman Shah', phone: '+92 302 3334455', speciality: 'Coats & Waistcoats', maxCapacity: 6 },
    { id: 'k3', name: 'Yaqub Ali', phone: '+92 303 4445566', speciality: 'Pant & Shirt', maxCapacity: 6 },
    { id: 'k4', name: 'Naveed Iqbal', phone: '+92 304 5556677', speciality: 'Thobe & Formal Wear', maxCapacity: 5 }
  ];
  Store.saveKarigars(karigars);

  // ---- customers ----
  const names = [
    'Ahmad Khan', 'Zarmeena Bibi', 'Imran Wazir', 'Shahid Afridi', 'Bilal Hussain',
    'Fatima Noor', 'Usman Tariq', 'Ayesha Malik', 'Hamza Sheikh', 'Sana Javed'
  ];
  const phones = [
    '3001112233', '3012223344', '3023334455', '3034445566', '3045556677',
    '3056667788', '3067778899', '3078889900', '3089990011', '3090001122'
  ];
  const addresses = [
    'Street 4, Model Town, Lahore', 'House 22, G-9, Islamabad', 'Sector 5, DHA, Karachi',
    'Circular Road, Multan', 'Block C, Satellite Town, Rawalpindi', 'Kohati Gate, Peshawar',
    'Susan Road, Faisalabad', 'Cantt Area, Sialkot', 'Township, Lahore', 'Gulberg, Lahore'
  ];
  const templateKeys = Object.keys(DEFAULT_TEMPLATES);
  const customers = [];
  const measurements = [];
  const now = Date.now();
  for(let i = 0; i < names.length; i++){
    const id = Store.uid('cus');
    const createdAt = now - (90 - i * 6) * 86400000;
    customers.push({
      id,
      customerId: 'TMT-' + String(i + 1).padStart(3, '0'),
      name: names[i],
      phone: '+92 ' + phones[i],
      address: addresses[i],
      createdAt
    });
    const template = templateKeys[i % templateKeys.length];
    const fields = {};
    DEFAULT_TEMPLATES[template].fields.forEach((f, fi) => {
      fields[f.key] = String(26 + ((i + fi * 3) % 20));
    });
    measurements.push({
      customerId: id,
      template,
      fields,
      notes: i % 3 === 0 ? 'Prefers slightly loose fit around the chest.' : '',
      updatedAt: createdAt
    });
  }
  Store.saveCustomers(customers);
  Store.saveMeasurements(measurements);

  // ---- orders + payments ----
  // Reuses the same style option lists the New Order picker and Order Card
  // draw from (defined in shared.js), so seeded orders render real icons too.
  const styles = {
    sleeve: SLEEVE_OPTS,
    cuff: CUFF_OPTS,
    collar: COLLAR_OPTS,
    neck: NECK_OPTS,
    length: LENGTH_OPTS,
    fit: FIT_OPTS,
    placket: PLACKET_OPTS,
    pocket: POCKET_OPTS,
    pocketShalwar: POCKET_SHALWAR_OPTS,
    pocketPosition: POCKET_POSITION_OPTS,
    pocketDepth: POCKET_DEPTH_OPTS,
    daman: DAMAN_OPTS,
    fabric: FABRIC_OPTS,
    buttonStyle: BUTTON_STYLE_OPTS,
    buttonCount: BUTTON_COUNT_OPTS,
    color: COLOR_OPTS.map(c => c.hex)
  };
  const statuses = ['progress', 'progress', 'progress', 'ready', 'ready', 'delivered', 'delivered'];
  const orders = [];
  const payments = [];
  for(let i = 0; i < 15; i++){
    const custIdx = i % customers.length;
    const cust = customers[custIdx];
    const kar = karigars[i % karigars.length];
    const status = statuses[i % statuses.length];
    const assignedDate = now - (40 - i * 2) * 86400000;
    const deadline = assignedDate + (7 + (i % 10)) * 86400000;
    const total = 3000 + (i % 6) * 1200;
    const orderId = Store.uid('ord');
    // on-time roughly 2 out of every 3 delivered orders, for a believable on-time rate
    const deliveredDate = status === 'delivered' ? (i % 3 === 2 ? deadline + 2 * 86400000 : deadline - 1 * 86400000) : null;
    const region = REGIONAL_OPTS[i % REGIONAL_OPTS.length];
    const regionShalwarOpts = region === 'Pukhtoon' ? PUKHTOON_SHALWAR_OPTS : PUNJABI_SHALWAR_OPTS;
    orders.push({
      id: orderId,
      orderNo: 'ORD-' + String(i + 1).padStart(4, '0'),
      customerId: cust.id,
      style: {
        regionalStyle: region,
        fit: styles.fit[i % styles.fit.length],
        length: styles.length[i % styles.length.length],
        sleeve: styles.sleeve[i % styles.sleeve.length],
        cuff: styles.cuff[i % styles.cuff.length],
        collar: styles.collar[i % styles.collar.length],
        neck: styles.neck[i % styles.neck.length],
        shalwarStyle: regionShalwarOpts[i % regionShalwarOpts.length],
        mori: region === 'Pukhtoon' ? MORI_OPTS[i % (MORI_OPTS.length - 1)] : undefined,
        waistType: region === 'Pukhtoon' ? WAIST_TYPE_OPTS[i % WAIST_TYPE_OPTS.length] : undefined,
        placket: styles.placket[i % (styles.placket.length - 1)],
        pocket: styles.pocket[i % styles.pocket.length],
        pocketShalwar: styles.pocketShalwar[i % styles.pocketShalwar.length],
        pocketPosition: styles.pocketPosition[i % styles.pocketPosition.length],
        pocketDepth: styles.pocketDepth[i % styles.pocketDepth.length],
        daman: styles.daman[i % styles.daman.length],
        fabric: styles.fabric[i % styles.fabric.length],
        buttonStyle: styles.buttonStyle[i % (styles.buttonStyle.length - 1)],
        buttonCount: styles.buttonCount[i % (styles.buttonCount.length - 1)],
        color: styles.color[i % styles.color.length]
      },
      // Snapshot the customer's seeded measurement so the order card has
      // something real to show, same as a live-created order would.
      measurementSnapshot: {
        template: measurements[custIdx].template,
        fields: measurements[custIdx].fields,
        notes: measurements[custIdx].notes
      },
      photoRefs: [],
      karigarId: kar.id,
      assignedDate,
      deadline,
      status,
      deliveredDate,
      totalAmount: total
    });
    // advance payment for most orders
    if(i % 4 !== 3){
      payments.push({
        id: Store.uid('pay'),
        orderId,
        amount: Math.round(total * (status === 'delivered' ? 1 : 0.5) / 100) * 100,
        method: ['cash', 'easypaisa', 'jazzcash', 'bank'][i % 4],
        date: assignedDate,
        note: status === 'delivered' ? 'Full and final' : 'Advance'
      });
    }
  }
  Store.saveOrders(orders);
  Store.savePayments(payments);

  localStorage.setItem(STORE_KEYS.seeded, '1');
}
