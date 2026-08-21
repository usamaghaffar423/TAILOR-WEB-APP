/* ==========================================================================
   Top Man Tailor — new-order.js
   Customer autofill, dynamic measurement templates, style customization with
   live garment preview, photo attach (base64, prototype only), assign & save.
   ========================================================================== */

(function(){
  const templates = Store.getTemplates();
  const karigars = Store.getKarigars();

  let selectedCustomerId = null;
  let photos = [];

  // SLEEVE_OPTS, COLLAR_OPTS, PLACKET_OPTS, POCKET_OPTS, DAMAN_OPTS, COLOR_OPTS,
  // and the whole Pukhtoon/Punjabi option catalogue + *_ICON maps are defined
  // once in shared.js and reused here and by the Order Card, so the picker
  // and the card always agree.
  let selRegion = REGIONAL_OPTS[0];
  let selCollar = COLLAR_OPTS[0], selSleeve = SLEEVE_OPTS[0], selCuff = CUFF_OPTS[0], selNeck = NECK_OPTS[0];
  let selFit = recommendedFit(selRegion), fitTouched = false;
  let selLength = LENGTH_OPTS[0];
  let selPukhtoonShalwar = PUKHTOON_SHALWAR_OPTS[0], selPunjabiShalwar = PUNJABI_SHALWAR_OPTS[0];
  let selMori = MORI_OPTS[1], selWaistType = WAIST_TYPE_OPTS[0];
  let selPlacket = PLACKET_OPTS[0], selPocket = POCKET_OPTS[0], selPocketShalwar = POCKET_SHALWAR_OPTS[0];
  let selPocketPosition = '', selPocketDepth = '';
  let selDaman = DAMAN_OPTS[0];
  let selFabric = FABRIC_OPTS[0], selButtonStyle = BUTTON_STYLE_OPTS[0], selButtonCount = BUTTON_COUNT_OPTS[0];
  let selColor = COLOR_OPTS[0].hex;

  const mTemplate = document.getElementById('mTemplate');
  const measFields = document.getElementById('measFields');
  const cId = document.getElementById('cId');
  const cName = document.getElementById('cName');
  const cPhone = document.getElementById('cPhone');
  const cAddress = document.getElementById('cAddress');
  const custSearch = document.getElementById('custSearch');
  const custResults = document.getElementById('custResults');
  const kameezOnlyFields = document.getElementById('kameezOnlyFields');
  const kameezOnlyAdvanced = document.getElementById('kameezOnlyAdvanced');
  const aKarigar = document.getElementById('aKarigar');

  // Regional (Pukhtoon/Punjabi) fields — declared up front since
  // renderMeasFields() (called immediately below) needs updateRegionalVisibility().
  const pukhtoonShalwarField = document.getElementById('pukhtoonShalwarField');
  const punjabiShalwarField = document.getElementById('punjabiShalwarField');
  const moriField = document.getElementById('moriField');
  const waistTypeField = document.getElementById('waistTypeField');
  function updateRegionalVisibility(){
    const isPukhtoon = selRegion === 'Pukhtoon';
    pukhtoonShalwarField.style.display = isPukhtoon ? '' : 'none';
    punjabiShalwarField.style.display = isPukhtoon ? 'none' : '';
    moriField.style.display = isPukhtoon ? '' : 'none';
    waistTypeField.style.display = isPukhtoon ? '' : 'none';
  }

  // ---- template dropdown ----
  mTemplate.innerHTML = Object.keys(templates).map(key => `<option value="${key}">${templates[key].label}</option>`).join('');
  aKarigar.innerHTML = karigars.map(k => `<option value="${k.id}">${k.name} — ${k.speciality || ''}</option>`).join('');
  cId.value = Store.nextCustomerCode();

  function renderMeasFields(templateKey, existingFields){
    // buildEditableMeasurementFieldsHtml lives in shared.js so this and the
    // Customer Detail "Edit Measurements" mode render identical field sets.
    measFields.innerHTML = buildEditableMeasurementFieldsHtml(templateKey, existingFields);
    const isKameez = templateKey.startsWith('shalwar-kameez');
    kameezOnlyFields.style.display = isKameez ? '' : 'none';
    kameezOnlyAdvanced.style.display = isKameez ? '' : 'none';
    updateRegionalVisibility();
    renderPreview(templateKey);
  }

  function kameezSvg(color){
    return `
      <svg viewBox="0 0 160 220" width="160" height="220">
        <path d="M55 10 L80 26 L105 10 L120 30 L108 46 L108 70 L130 200 L100 210 L100 130 L60 130 L60 210 L30 200 L52 70 L52 46 L40 30 Z"
          fill="${color}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
        <path d="M55 10 L80 26 L105 10" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>
      </svg>`;
  }

  function renderPreview(templateKey){
    const panel = document.getElementById('previewPanel');
    if(templateKey === 'shalwar-kameez-men' || templateKey === 'shalwar-kameez-women'){
      panel.innerHTML = kameezSvg(selColor) + `<div style="font-size:11.5px;color:var(--text-faint);">Live preview · ${templates[templateKey].label}</div>`;
    } else {
      panel.innerHTML = `<div class="preview-placeholder">No live preview for<br><b>${templates[templateKey] ? templates[templateKey].label : templateKey}</b></div>`;
    }
  }

  mTemplate.addEventListener('change', () => renderMeasFields(mTemplate.value, null));
  renderMeasFields(mTemplate.value, null);

  // ---- style option cards (illustrated) ----
  function renderIconGroup(containerId, options, iconMap, selected, onPick){
    const el = document.getElementById(containerId);
    if(!el) return;
    el.innerHTML = options.map(o => `
      <div class="style-option-card${o === selected ? ' selected' : ''}" data-val="${o}" tabindex="0" role="button" aria-pressed="${o === selected}">
        ${iconMap[o] || ''}
        <span class="label">${o}</span>
      </div>`).join('');
    el.querySelectorAll('.style-option-card').forEach(card => {
      const select = () => {
        el.querySelectorAll('.style-option-card').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-pressed', 'false'); });
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
        onPick(card.getAttribute('data-val'));
      };
      card.addEventListener('click', select);
      card.addEventListener('keydown', e => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); select(); }
      });
    });
  }

  // Plain text chips for attributes that don't have a meaningful icon
  // (pocket position/depth) — same interaction pattern as the icon cards,
  // reusing the existing .swatch-chip component instead of a new one.
  function renderChipGroup(containerId, options, selected, onPick){
    const el = document.getElementById(containerId);
    if(!el) return;
    el.innerHTML = options.map(o => `<div class="swatch-chip${o === selected ? ' selected' : ''}" data-val="${o}">${o}</div>`).join('');
    el.querySelectorAll('.swatch-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.querySelectorAll('.swatch-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        onPick(chip.getAttribute('data-val'));
      });
    });
  }

  function renderSelectOptions(selectId, options, selected){
    const el = document.getElementById(selectId);
    if(!el) return;
    el.innerHTML = options.map(o => `<option value="${o}" ${o === selected ? 'selected' : ''}>${o}</option>`).join('');
  }

  renderIconGroup('swCollar', COLLAR_OPTS, COLLAR_ICON, selCollar, v => selCollar = v);
  renderIconGroup('swSleeve', SLEEVE_OPTS, SLEEVE_ICON, selSleeve, v => selSleeve = v);
  renderIconGroup('swCuff', CUFF_OPTS, CUFF_ICON, selCuff, v => selCuff = v);
  renderIconGroup('swNeck', NECK_OPTS, NECK_ICON, selNeck, v => selNeck = v);
  renderIconGroup('swLength', LENGTH_OPTS, LENGTH_ICON, selLength, v => selLength = v);
  renderIconGroup('swPlacket', PLACKET_OPTS, PLACKET_ICON, selPlacket, v => selPlacket = v);
  renderIconGroup('swPocket', POCKET_OPTS, POCKET_ICON, selPocket, v => selPocket = v);
  renderIconGroup('swPocketShalwar', POCKET_SHALWAR_OPTS, POCKET_SHALWAR_ICON, selPocketShalwar, v => selPocketShalwar = v);
  renderIconGroup('swPukhtoonShalwar', PUKHTOON_SHALWAR_OPTS, PUKHTOON_SHALWAR_ICON, selPukhtoonShalwar, v => selPukhtoonShalwar = v);
  renderIconGroup('swPunjabiShalwar', PUNJABI_SHALWAR_OPTS, PUNJABI_SHALWAR_ICON, selPunjabiShalwar, v => selPunjabiShalwar = v);
  renderIconGroup('swMori', MORI_OPTS, MORI_ICON, selMori, v => selMori = v);
  renderIconGroup('swWaistType', WAIST_TYPE_OPTS, WAIST_TYPE_ICON, selWaistType, v => selWaistType = v);
  renderIconGroup('swDaman', DAMAN_OPTS, DAMAN_ICON, selDaman, v => selDaman = v);
  renderChipGroup('swPocketPosition', POCKET_POSITION_OPTS, selPocketPosition, v => selPocketPosition = v);
  renderChipGroup('swPocketDepth', POCKET_DEPTH_OPTS, selPocketDepth, v => selPocketDepth = v);
  renderSelectOptions('sFabric', FABRIC_OPTS, selFabric);
  renderSelectOptions('sButtonStyle', BUTTON_STYLE_OPTS, selButtonStyle);
  renderSelectOptions('sButtonCount', BUTTON_COUNT_OPTS, selButtonCount);
  document.getElementById('sFabric').addEventListener('change', e => selFabric = e.target.value);
  document.getElementById('sButtonStyle').addEventListener('change', e => selButtonStyle = e.target.value);
  document.getElementById('sButtonCount').addEventListener('change', e => selButtonCount = e.target.value);

  // ---- Garment Style (Pukhtoon / Punjabi) — drives which regional shalwar
  // block is shown and recommends a default Fit, without overriding a Fit
  // the user already picked themselves. ----
  renderIconGroup('swRegion', REGIONAL_OPTS, REGIONAL_ICON, selRegion, v => {
    selRegion = v;
    updateRegionalVisibility();
    if(!fitTouched){
      selFit = recommendedFit(selRegion);
      renderIconGroup('swFit', FIT_OPTS, FIT_ICON, selFit, v2 => { selFit = v2; fitTouched = true; });
    }
  });
  renderIconGroup('swFit', FIT_OPTS, FIT_ICON, selFit, v => { selFit = v; fitTouched = true; });
  updateRegionalVisibility();

  const colorDots = document.getElementById('colorDots');
  const customColorInput = document.getElementById('customColorInput');
  function renderColorDots(){
    const isCustom = !COLOR_OPTS.some(c => c.hex.toLowerCase() === selColor.toLowerCase());
    colorDots.innerHTML = COLOR_OPTS.map(c => `<div class="color-dot${c.hex === selColor ? ' selected' : ''}" style="background:${c.hex};" data-val="${c.hex}" title="${c.name}" aria-label="${c.name}"></div>`).join('')
      + `<div class="color-dot${isCustom ? ' selected' : ''}" id="customColorDot" title="Custom color" aria-label="Custom color"
           style="background:${isCustom ? selColor : 'var(--surface)'}; border:1.5px dashed var(--border-strong); display:flex; align-items:center; justify-content:center; font-size:15px; color:var(--text-faint);">${isCustom ? '' : '+'}</div>`;
    colorDots.querySelectorAll('.color-dot[data-val]').forEach(dot => {
      dot.addEventListener('click', () => {
        selColor = dot.getAttribute('data-val');
        renderColorDots();
        renderPreview(mTemplate.value);
      });
    });
    document.getElementById('customColorDot').addEventListener('click', () => customColorInput.click());
  }
  renderColorDots();
  customColorInput.addEventListener('input', () => {
    selColor = customColorInput.value;
    renderColorDots();
    renderPreview(mTemplate.value);
  });

  // ---- customer search / autofill ----
  function selectCustomer(customer){
    selectedCustomerId = customer.id;
    cName.value = customer.name;
    cPhone.value = customer.phone;
    cAddress.value = customer.address || '';
    cId.value = customer.customerId;
    custSearch.value = `${customer.name} (${customer.customerId})`;
    custResults.style.display = 'none';

    const meas = Store.getMeasurementsForCustomer(customer.id).sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if(meas){
      mTemplate.value = meas.template;
      renderMeasFields(meas.template, meas.fields);
      document.getElementById('mNotes').value = meas.notes || '';
    }
  }

  custSearch.addEventListener('input', () => {
    const q = custSearch.value.trim().toLowerCase();
    selectedCustomerId = null;
    if(!q){ custResults.style.display = 'none'; return; }
    const matches = Store.getCustomers().filter(c =>
      c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q) || (c.customerId || '').toLowerCase().includes(q)
    ).slice(0, 8);
    if(matches.length === 0){
      custResults.style.display = 'block';
      custResults.innerHTML = `<div style="padding:10px 12px;font-size:12px;color:var(--text-faint);">No matching customers — this will be a new customer.</div>`;
      return;
    }
    custResults.style.display = 'block';
    custResults.innerHTML = matches.map(c => `
      <div class="cs-result" data-id="${c.id}" style="padding:10px 12px;font-size:12.5px;cursor:pointer;border-bottom:1px solid var(--border);">
        <b>${c.name}</b> <span style="color:var(--text-faint);">${c.customerId} · ${c.phone}</span>
      </div>`).join('');
    custResults.querySelectorAll('.cs-result').forEach(el => {
      el.addEventListener('click', () => {
        const customer = Store.getCustomer(el.getAttribute('data-id'));
        if(customer) selectCustomer(customer);
      });
    });
  });

  // ---- prefill from ?customerId= ----
  const params = new URLSearchParams(window.location.search);
  const preId = params.get('customerId');
  if(preId){
    const customer = Store.getCustomer(preId);
    if(customer) selectCustomer(customer);
  }

  // ---- photo attach (click, keyboard, or drag & drop) ----
  const photoInput = document.getElementById('photoInput');
  const photoThumbs = document.getElementById('photoThumbs');
  const photoDrop = document.getElementById('photoDrop');
  const photoCount = document.getElementById('photoCount');

  function renderThumbs(){
    photoThumbs.innerHTML = photos.map((src, i) => `
      <div class="photo-thumb"><img src="${src}"><button class="rm" data-idx="${i}" type="button">&times;</button></div>`).join('');
    photoThumbs.querySelectorAll('.rm').forEach(btn => {
      btn.addEventListener('click', () => {
        photos.splice(parseInt(btn.getAttribute('data-idx'), 10), 1);
        renderThumbs();
      });
    });
    photoCount.textContent = photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'} attached` : '';
  }

  function handleFiles(fileList){
    Array.from(fileList || []).filter(f => f.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => { photos.push(e.target.result); renderThumbs(); };
      reader.readAsDataURL(file);
    });
  }

  photoInput.addEventListener('change', () => { handleFiles(photoInput.files); photoInput.value = ''; });
  photoDrop.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); photoInput.click(); }
  });
  ['dragenter', 'dragover'].forEach(evt => photoDrop.addEventListener(evt, e => {
    e.preventDefault(); photoDrop.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(evt => photoDrop.addEventListener(evt, e => {
    e.preventDefault(); photoDrop.classList.remove('dragover');
  }));
  photoDrop.addEventListener('drop', e => { handleFiles(e.dataTransfer.files); });

  // ---- payment status (No Payment Yet / Partial / Paid in Full) ----
  // Most customers pay on delivery rather than up front, so "No Payment
  // Yet" is an explicit, first-class choice rather than just an empty
  // amount field — and the remaining balance is always visible so the
  // tailor can see what's still owed at a glance.
  const aTotal = document.getElementById('aTotal');
  const aPaymentStatus = document.getElementById('aPaymentStatus');
  const aMethodField = document.getElementById('aMethodField');
  const aAmountField = document.getElementById('aAmountField');
  const aAdvance = document.getElementById('aAdvance');
  const aRemaining = document.getElementById('aRemaining');

  function updatePaymentUI(){
    const status = aPaymentStatus.value;
    aMethodField.style.display = status === 'none' ? 'none' : '';
    aAmountField.style.display = status === 'partial' ? '' : 'none';

    const total = parseFloat(aTotal.value) || 0;
    let paidNow = 0;
    if(status === 'full') paidNow = total;
    else if(status === 'partial') paidNow = parseFloat(aAdvance.value) || 0;
    aRemaining.value = total ? formatCurrency(Math.max(0, total - paidNow)) : '';
  }
  aPaymentStatus.addEventListener('change', updatePaymentUI);
  aTotal.addEventListener('input', updatePaymentUI);
  aAdvance.addEventListener('input', updatePaymentUI);
  updatePaymentUI();

  // ---- save ----
  document.getElementById('btnSaveOrder').addEventListener('click', () => {
    const name = cName.value.trim();
    const phone = cPhone.value.trim();
    if(!name || !phone){ showToast('Customer name and phone are required'); return; }

    const total = parseFloat(aTotal.value);
    if(!total || total <= 0){ showToast('Enter a valid total order amount'); return; }

    const paymentStatus = aPaymentStatus.value;
    let paidAmount = 0;
    if(paymentStatus === 'full'){
      paidAmount = total;
    } else if(paymentStatus === 'partial'){
      paidAmount = parseFloat(aAdvance.value) || 0;
      if(paidAmount <= 0){ showToast('Enter the amount paid, or switch to "No Payment Yet"'); return; }
      if(paidAmount > total){ showToast('Amount paid can\'t exceed the total order amount'); return; }
    }

    const deadlineVal = document.getElementById('aDeadline').value;
    if(!deadlineVal){ showToast('Please choose a deadline'); return; }
    if(!aKarigar.value){ showToast('Please assign a karigar'); return; }

    let customerId = selectedCustomerId;
    if(customerId){
      Store.updateCustomer(customerId, { name, phone, address: cAddress.value.trim() });
    } else {
      const customer = {
        id: Store.uid('cus'),
        customerId: cId.value,
        name, phone,
        address: cAddress.value.trim(),
        createdAt: Date.now()
      };
      Store.addCustomer(customer);
      customerId = customer.id;
    }

    const fields = {};
    measFields.querySelectorAll('input[data-key]').forEach(inp => { fields[inp.getAttribute('data-key')] = inp.value.trim(); });
    const notes = document.getElementById('mNotes').value.trim();
    Store.upsertMeasurement({
      customerId,
      template: mTemplate.value,
      fields,
      notes,
      updatedAt: Date.now()
    });

    const status = document.getElementById('aStatus').value;
    const isKameezOrder = mTemplate.value.startsWith('shalwar-kameez');
    const style = {
      collar: selCollar, sleeve: selSleeve, cuff: selCuff, neck: selNeck,
      placket: selPlacket, pocket: selPocket,
      fabric: selFabric, buttonStyle: selButtonStyle, buttonCount: selButtonCount,
      color: selColor
    };
    if(selPocketPosition) style.pocketPosition = selPocketPosition;
    if(selPocketDepth) style.pocketDepth = selPocketDepth;
    if(isKameezOrder){
      style.regionalStyle = selRegion;
      style.fit = selFit;
      style.length = selLength;
      style.shalwarStyle = selRegion === 'Pukhtoon' ? selPukhtoonShalwar : selPunjabiShalwar;
      style.pocketShalwar = selPocketShalwar;
      style.daman = selDaman;
      if(selRegion === 'Pukhtoon'){
        style.mori = selMori;
        style.waistType = selWaistType;
      }
    }
    const order = {
      id: Store.uid('ord'),
      orderNo: Store.nextOrderNo(),
      customerId,
      style,
      // Frozen copy of the measurements used for THIS order, so the karigar's
      // job card stays correct even if the customer's on-file measurements
      // are later updated by a different order.
      measurementSnapshot: { template: mTemplate.value, fields, notes },
      photoRefs: photos,
      karigarId: aKarigar.value,
      assignedDate: Date.now(),
      deadline: new Date(deadlineVal).getTime(),
      status,
      deliveredDate: status === 'delivered' ? Date.now() : null,
      totalAmount: total
    };
    Store.addOrder(order);

    if(paidAmount > 0){
      Store.addPayment({
        id: Store.uid('pay'),
        orderId: order.id,
        amount: paidAmount,
        method: document.getElementById('aMethod').value,
        date: Date.now(),
        note: paymentStatus === 'full' ? 'Full Payment' : 'Advance'
      });
    }

    showToast('Order ' + order.orderNo + ' created', 'success');
    setTimeout(() => { window.location.href = 'orders.html?q=' + encodeURIComponent(order.orderNo); }, 700);
  });
})();
