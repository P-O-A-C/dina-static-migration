/* Dina's Corner — guest menu basket and WhatsApp ordering.
   Uses the existing menu data and browser storage only; no Google Maps API or new DB tables. */
(function () {
  'use strict';
  if (!document.body || document.body.dataset.page !== 'menu' || !document.body.hasAttribute('data-menu-standalone')) return;

  const WHATSAPP_NUMBER = '201066670803'; // 01066670803 with Egypt country code
  const CART_KEY = 'dina_corner_whatsapp_cart_v1';
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  const money = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? (window.POA_FORMAT_CURRENCY ? window.POA_FORMAT_CURRENCY(amount) : 'ج.م ' + amount.toFixed(2)) : 'سيتم تأكيد السعر';
  };
  const priceOf = (value) => {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const readCart = () => {
    try {
      const rows = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(rows) ? rows.filter((row) => row && row.id && Number(row.quantity) > 0) : [];
    } catch (_) { return []; }
  };
  const saveCart = (rows) => {
    localStorage.setItem(CART_KEY, JSON.stringify(rows));
    renderCart();
    updateAddButtons();
  };
  const countItems = (rows) => rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const subtotalInfo = (rows) => {
    const known = rows.length > 0 && rows.every((row) => priceOf(row.price) !== null);
    return { known, total: known ? rows.reduce((sum, row) => sum + Number(row.price) * Number(row.quantity), 0) : null };
  };

  let selectedLocation = null;
  const customer = { name: '', phone: '', address: '', mapUrl: '' };

  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'dc-wa-cart-launch';
  launch.id = 'dcWaCartLaunch';
  launch.innerHTML = '<span class="dc-wa-cart-launch-icon" aria-hidden="true">🛒</span><span></span><b id="dcWaCartCount" hidden>0</b>';
  launch.setAttribute('aria-label', 'افتح سلة المشتريات');
  document.body.appendChild(launch);

  const backdrop = document.createElement('div');
  backdrop.className = 'dc-wa-cart-backdrop';
  backdrop.id = 'dcWaCartBackdrop';
  backdrop.hidden = true;
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.innerHTML = `
    <section class="dc-wa-cart-panel" role="dialog" aria-modal="true" aria-labelledby="dcWaCartTitle" tabindex="-1">
      <header class="dc-wa-cart-header">
        <div><span class="dc-wa-cart-kicker">DINA'S CORNER</span><h2 id="dcWaCartTitle">سلة المشتريات</h2></div>
        <button class="dc-wa-cart-close" type="button" data-dc-wa-close aria-label="إغلاق ">×</button>
      </header>
      <div id="dcWaCartContent"></div>
    </section>`;
  document.body.appendChild(backdrop);

  function updateLaunch() {
    const rows = readCart();
    const count = countItems(rows);
    const countNode = $('dcWaCartCount');
    if (countNode) {
      countNode.textContent = String(count);
      countNode.hidden = count === 0;
    }
    launch.setAttribute('aria-label', count ? `افتح سلة المشتريات، ${count} صنف` : 'افتح سلة المشتريات');
  }

  function updateAddButtons() {
    const rows = readCart();
    document.querySelectorAll('[data-dc-add-to-cart]').forEach((button) => {
      const row = rows.find((item) => String(item.id) === String(button.dataset.dcAddToCart));
      button.textContent = row ? `＋ أضف مرة أخرى (${Number(row.quantity)})` : '＋ أضف للسلة';
    });
    updateLaunch();
  }

  function closeCart() {
    backdrop.hidden = true;
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('dc-wa-cart-open');
    launch.focus();
  }
  function openCart() {
    renderCart();
    backdrop.hidden = false;
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('dc-wa-cart-open');
    backdrop.querySelector('.dc-wa-cart-panel')?.focus();
  }
  launch.addEventListener('click', openCart);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop || event.target.closest('[data-dc-wa-close]')) closeCart();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !backdrop.hidden) closeCart();
  });

  function addItem(item) {
    if (!item || !item.id || !String(item.name || '').trim()) return;
    const rows = readCart();
    const current = rows.find((row) => String(row.id) === String(item.id));
    if (current) {
      if (Number(current.quantity) >= 50) return;
      current.quantity = Number(current.quantity) + 1;
      current.name = String(item.name);
      current.price = priceOf(item.price);
      current.image_url = item.image_url || null;
    } else {
      rows.push({ id: String(item.id), name: String(item.name), price: priceOf(item.price), image_url: item.image_url || null, quantity: 1 });
    }
    saveCart(rows);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-dc-add-to-cart]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const allItems = Array.isArray(window.POACurrentMenuItems) ? window.POACurrentMenuItems : [];
    const item = allItems.find((row) => String(row.id) === String(button.dataset.dcAddToCart));
    if (!item) {
      window.alert('الصنف غير متاح حاليًا. حدّث الصفحة وحاول مرة أخرى.');
      return;
    }
    addItem(item);
    button.classList.add('is-added');
    const oldText = button.textContent;
    button.textContent = 'تمت الإضافة ✓';
    window.setTimeout(() => { if (button.isConnected) { button.textContent = oldText; updateAddButtons(); } }, 950);
  });

  function renderCart() {
    const rows = readCart();
    const content = $('dcWaCartContent');
    if (!content) return;
    const info = subtotalInfo(rows);
    if (!rows.length) {
      content.innerHTML = '<div class="dc-wa-cart-empty"><span aria-hidden="true">🛍️</span><h3>السلة فارغة</h3><p>اختار الأصناف اللي تحبها من المنيو واضغط «Add ».</p><button type="button" class="dc-wa-secondary" data-dc-wa-close>العودة للمنيو</button></div>';
      updateLaunch();
      return;
    }

    const lines = rows.map((row) => {
      const unit = priceOf(row.price);
      const thumb = row.image_url
        ? `<img src="${esc(row.image_url)}" alt="" onerror="this.hidden=true">`
        : '<span class="dc-wa-cart-thumb-fallback" aria-hidden="true">✦</span>';
      return `<article class="dc-wa-cart-row">${thumb}<div class="dc-wa-cart-item-copy"><strong>${esc(row.name)}</strong><small>${unit === null ? 'السعر عند التأكيد' : esc(money(unit)) + ' للقطعة'}</small><div class="dc-wa-qty"><button type="button" data-dc-wa-qty="-1" data-id="${esc(row.id)}" aria-label="تقليل الكمية">−</button><output>${Number(row.quantity)}</output><button type="button" data-dc-wa-qty="1" data-id="${esc(row.id)}" aria-label="زيادة الكمية">+</button><button type="button" class="dc-wa-remove" data-dc-wa-remove="${esc(row.id)}">حذف</button></div></div><strong class="dc-wa-line-total">${unit === null ? '—' : esc(money(unit * Number(row.quantity)))}</strong></article>`;
    }).join('');

    content.innerHTML = `
      <div class="dc-wa-cart-lines">${lines}</div>
      <div class="dc-wa-subtotal"><span>إجمالي الأصناف</span><strong>${info.known ? esc(money(info.total)) : 'سيتم تأكيد السعر'}</strong></div>
      <p class="dc-wa-delivery-note">السعر لا يشمل التوصيل. يتم الاتفاق على رسوم التوصيل بشكل منفصل.</p>
      <form class="dc-wa-order-form" id="dcWaOrderForm">
        <h3>بيانات العميل</h3>
        <label>الاسم<input name="name" id="dcWaCustomerName" autocomplete="name" required maxlength="100" value="${esc(customer.name)}" placeholder="اكتب اسمك"></label>
        <label>رقم التليفون<input name="phone" id="dcWaCustomerPhone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="25" value="${esc(customer.phone)}" placeholder="01xxxxxxxxx"></label>
        <label>العنوان<input name="address" id="dcWaCustomerAddress" required maxlength="300" value="${esc(customer.address)}" placeholder="اكتب عنوان التوصيل بالتفصيل"></label>
        <div class="dc-wa-map-actions">
          <button type="button" class="dc-wa-secondary" id="dcWaGetLocation">⌖ تحديد موقعي الحالي</button>
          <a class="dc-wa-secondary dc-wa-map-search" id="dcWaSearchAddress" href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">فتح Google Maps لاختيار العنوان</a>
        </div>
        <small class="dc-wa-location-status" id="dcWaLocationStatus">اكتب العنوان يدويًا، أو حدّد موقعك الحالي. لاختيار دبوس من Google Maps: افتح الخريطة، اضغط مشاركة ثم انسخ الرابط والصقه في الحقل الاختياري.</small>
        <label>رابط Google Maps (اختياري)<input name="mapUrl" id="dcWaMapUrl" type="url" maxlength="1000" value="${esc(customer.mapUrl)}" placeholder="الصق رابط مشاركة الموقع من Google Maps"></label>
        <button class="dc-wa-submit" type="submit">أطلب حالًا عبر واتساب <span aria-hidden="true">➜</span></button>
        <p class="dc-wa-privacy-note">سيتم فتح واتساب برسالة طلب جاهزة. راجعها واضغط إرسال لتأكيد طلبك.</p>
      </form>`;

    content.querySelectorAll('[data-dc-wa-qty]').forEach((button) => button.addEventListener('click', () => {
      captureCustomer();
      const next = readCart();
      const row = next.find((item) => String(item.id) === String(button.dataset.id));
      if (!row) return;
      const value = Number(row.quantity) + Number(button.dataset.dcWaQty);
      if (value <= 0) saveCart(next.filter((item) => String(item.id) !== String(row.id)));
      else if (value <= 50) { row.quantity = value; localStorage.setItem(CART_KEY, JSON.stringify(next)); }
      renderCart();
      updateAddButtons();
    }));
    content.querySelectorAll('[data-dc-wa-remove]').forEach((button) => button.addEventListener('click', () => {
      captureCustomer();
      saveCart(readCart().filter((row) => String(row.id) !== String(button.dataset.dcWaRemove)));
    }));

    $('dcWaCustomerName')?.addEventListener('input', captureCustomer);
    $('dcWaCustomerPhone')?.addEventListener('input', captureCustomer);
    $('dcWaCustomerAddress')?.addEventListener('input', () => { captureCustomer(); updateAddressSearchLink(); });
    $('dcWaMapUrl')?.addEventListener('input', captureCustomer);
    $('dcWaGetLocation')?.addEventListener('click', getCurrentLocation);
    $('dcWaOrderForm')?.addEventListener('submit', submitWhatsAppOrder);
    updateAddressSearchLink();
    updateLaunch();
  }

  function captureCustomer() {
    const name = $('dcWaCustomerName');
    const phone = $('dcWaCustomerPhone');
    const address = $('dcWaCustomerAddress');
    const mapUrl = $('dcWaMapUrl');
    if (name) customer.name = name.value;
    if (phone) customer.phone = phone.value;
    if (address) customer.address = address.value;
    if (mapUrl) customer.mapUrl = mapUrl.value;
  }
  function updateAddressSearchLink() {
    const link = $('dcWaSearchAddress');
    const address = String($('dcWaCustomerAddress')?.value || customer.address || '').trim();
    if (link && address) link.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
  }

  function getCurrentLocation() {
    const status = $('dcWaLocationStatus');
    const button = $('dcWaGetLocation');
    if (!navigator.geolocation) {
      if (status) status.textContent = 'المتصفح لا يدعم تحديد الموقع. اكتب العنوان يدويًا أو الصق رابط Google Maps.';
      return;
    }
    button.disabled = true;
    if (status) status.textContent = 'جارٍ تحديد موقعك… وافق على طلب الموقع من المتصفح.';
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = Number(position.coords.latitude.toFixed(6));
      const lng = Number(position.coords.longitude.toFixed(6));
      selectedLocation = { lat, lng };
      customer.mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      const mapInput = $('dcWaMapUrl');
      if (mapInput) mapInput.value = customer.mapUrl;
      const address = $('dcWaCustomerAddress');
      if (address && !address.value.trim()) address.value = 'موقعي الحالي المحدد على الخريطة';
      captureCustomer();
      if (status) status.innerHTML = 'تم تحديد الموقع. <a href="' + esc(customer.mapUrl) + '" target="_blank" rel="noopener noreferrer">عرض موقعي على Google Maps</a>';
      button.disabled = false;
    }, (error) => {
      const message = error.code === 1 ? 'لم تسمح بالوصول للموقع. يمكنك كتابة العنوان يدويًا أو لصق رابط الخريطة.' : 'تعذر تحديد الموقع الآن. اكتب العنوان يدويًا أو حاول مرة أخرى.';
      if (status) status.textContent = message;
      button.disabled = false;
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  function submitWhatsAppOrder(event) {
    event.preventDefault();
    captureCustomer();
    const rows = readCart();
    if (!rows.length) { window.alert('السلة فارغة. أضف صنفًا واحدًا على الأقل.'); return; }
    const name = customer.name.trim();
    const phone = customer.phone.trim();
    const address = customer.address.trim();
    const digits = phone.replace(/[^0-9+]/g, '');
    const digitCount = digits.replace(/\D/g, '').length;
    if (!name || !phone || !address) { window.alert('من فضلك أكمل الاسم ورقم التليفون والعنوان.'); return; }
    if (digitCount < 8 || digitCount > 15) { window.alert('من فضلك اكتب رقم تليفون صحيح.'); $('dcWaCustomerPhone')?.focus(); return; }

    const info = subtotalInfo(rows);
    const lines = rows.map((row, index) => {
      const unit = priceOf(row.price);
      const rowTotal = unit === null ? 'السعر عند التأكيد' : money(unit * Number(row.quantity));
      return `${index + 1}) ${row.name} × ${Number(row.quantity)} — ${rowTotal}`;
    });
    const map = (customer.mapUrl || '').trim();
    const message = [
      'مرحبًا Dina’s Corner، أريد تأكيد الطلب التالي:',
      '',
      ...lines,
      '',
      `إجمالي الأصناف: ${info.known ? money(info.total) : 'يحتاج تأكيد من الفرع'}`,
      'ملاحظة: السعر لا يشمل التوصيل، ورسوم التوصيل يتم الاتفاق عليها بشكل منفصل.',
      '',
      'بيانات العميل:',
      `الاسم: ${name}`,
      `رقم التليفون: ${phone}`,
      `العنوان: ${address}`,
      ...(map ? [`موقع Google Maps: ${map}`] : []),
      '',
      'برجاء تأكيد توافر الأصناف وتفاصيل التوصيل.'
    ].join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  window.addEventListener('storage', (event) => {
    if (event.key === CART_KEY) { renderCart(); updateAddButtons(); }
  });
  window.DCWhatsAppOrder = { openCart, addItem, renderCart };
  renderCart();
  updateAddButtons();
})();
