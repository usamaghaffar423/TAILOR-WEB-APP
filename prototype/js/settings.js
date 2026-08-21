/* ==========================================================================
   Top Man Tailor — settings.js
   Shop details, measurement-template editor, theme default preference.
   ========================================================================== */

(function(){
  // ---- Shop details ----
  const shop = Store.getShop();
  document.getElementById('sName').value = shop.name || '';
  document.getElementById('sPhone').value = shop.phone || '';
  document.getElementById('sAddress').value = shop.address || '';

  // Logo/banner are stored as base64 in the shop record, same prototype
  // approach as order reference photos — production build would upload to
  // R2/S3 and store a URL instead.
  const logoPreview = document.getElementById('logoPreview');
  const btnLogoRemove = document.getElementById('btnLogoRemove');
  function renderLogoPreview(){
    const s = Store.getShop();
    if(s.logo){
      logoPreview.innerHTML = `<img src="${s.logo}" alt="Shop logo">`;
      btnLogoRemove.style.display = '';
    } else {
      logoPreview.textContent = initials(s.name || 'Top Man');
      btnLogoRemove.style.display = 'none';
    }
    const brandMark = document.querySelector('#appSidebar .brand-mark');
    if(brandMark) brandMark.innerHTML = s.logo ? `<img src="${s.logo}" alt="Shop logo">` : `<span>${initials(s.name || 'Top Man Tailor')}</span>`;
  }
  renderLogoPreview();

  const logoInput = document.getElementById('logoInput');
  document.getElementById('btnLogoChange').addEventListener('click', () => logoInput.click());
  logoInput.addEventListener('change', () => {
    const file = logoInput.files[0];
    if(!file) return;
    if(file.size > 1.5 * 1024 * 1024) showToast('Logo is large — a smaller image will load faster');
    const reader = new FileReader();
    reader.onload = e => {
      Store.saveShop(Object.assign({}, Store.getShop(), { logo: e.target.result }));
      renderLogoPreview();
      showToast('Logo updated', 'success');
    };
    reader.readAsDataURL(file);
    logoInput.value = '';
  });
  btnLogoRemove.addEventListener('click', () => {
    const s = Object.assign({}, Store.getShop());
    delete s.logo;
    Store.saveShop(s);
    renderLogoPreview();
    showToast('Logo removed', 'success');
  });

  const bannerPreview = document.getElementById('bannerPreview');
  const btnBannerRemove = document.getElementById('btnBannerRemove');
  function renderBannerPreview(){
    const s = Store.getShop();
    if(s.banner){
      bannerPreview.innerHTML = `<img src="${s.banner}" alt="Shop banner">`;
      btnBannerRemove.style.display = '';
    } else {
      bannerPreview.textContent = 'No banner uploaded';
      btnBannerRemove.style.display = 'none';
    }
  }
  renderBannerPreview();

  const bannerInput = document.getElementById('bannerInput');
  document.getElementById('btnBannerChange').addEventListener('click', () => bannerInput.click());
  bannerInput.addEventListener('change', () => {
    const file = bannerInput.files[0];
    if(!file) return;
    if(file.size > 2 * 1024 * 1024) showToast('Banner is large — a smaller image will load faster');
    const reader = new FileReader();
    reader.onload = e => {
      Store.saveShop(Object.assign({}, Store.getShop(), { banner: e.target.result }));
      renderBannerPreview();
      showToast('Banner updated', 'success');
    };
    reader.readAsDataURL(file);
    bannerInput.value = '';
  });
  btnBannerRemove.addEventListener('click', () => {
    const s = Object.assign({}, Store.getShop());
    delete s.banner;
    Store.saveShop(s);
    renderBannerPreview();
    showToast('Banner removed', 'success');
  });

  document.getElementById('btnSaveShop').addEventListener('click', () => {
    const name = document.getElementById('sName').value.trim();
    if(!name){ showToast('Shop name is required'); return; }
    Store.saveShop(Object.assign({}, Store.getShop(), {
      name,
      phone: document.getElementById('sPhone').value.trim(),
      address: document.getElementById('sAddress').value.trim()
    }));
    showToast('Shop details saved', 'success');
    renderLogoPreview();
  });

  // ---- Measurement template editor ----
  let templates = Store.getTemplates();
  const tplSelect = document.getElementById('tplSelect');
  const tplFields = document.getElementById('tplFields');

  tplSelect.innerHTML = Object.keys(templates).map(key => `<option value="${key}">${templates[key].label}</option>`).join('');

  function slugify(label){
    return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || ('field_' + Date.now());
  }

  function renderFields(){
    const tpl = templates[tplSelect.value];
    tplFields.innerHTML = tpl.fields.map((f, i) => `
      <div style="display:flex;gap:10px;align-items:center;">
        <input type="text" data-idx="${i}" class="tpl-field-label" value="${f.label}" style="flex:1;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;">
        <span class="cell-mono cell-muted" style="font-size:11px;min-width:80px;">${f.key}</span>
        <button class="modal-close" data-idx="${i}" data-act="remove-field" title="Remove field">&times;</button>
      </div>`).join('');
    tplFields.querySelectorAll('[data-act="remove-field"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        templates[tplSelect.value].fields.splice(idx, 1);
        renderFields();
      });
    });
  }
  tplSelect.addEventListener('change', renderFields);
  renderFields();

  document.getElementById('btnAddField').addEventListener('click', () => {
    const label = prompt('New field label (e.g. "Cuff Width")');
    if(!label) return;
    templates[tplSelect.value].fields.push({ key: slugify(label), label: label.trim() });
    renderFields();
  });

  document.getElementById('btnSaveTemplate').addEventListener('click', () => {
    const tpl = templates[tplSelect.value];
    tplFields.querySelectorAll('.tpl-field-label').forEach(inp => {
      const idx = parseInt(inp.getAttribute('data-idx'), 10);
      if(tpl.fields[idx]) tpl.fields[idx].label = inp.value.trim() || tpl.fields[idx].label;
    });
    Store.saveTemplates(templates);
    showToast('Template updated', 'success');
    renderFields();
  });

  // ---- Theme default ----
  const themeGroup = document.getElementById('themeDefaultGroup');
  const currentDefault = shop.themeDefault || 'dark';
  themeGroup.querySelectorAll('.swatch-chip').forEach(chip => {
    chip.classList.toggle('selected', chip.getAttribute('data-val') === currentDefault);
    chip.addEventListener('click', () => {
      themeGroup.querySelectorAll('.swatch-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      Store.saveShop(Object.assign({}, Store.getShop(), { themeDefault: chip.getAttribute('data-val') }));
      showToast('Default theme updated', 'success');
    });
  });
})();
