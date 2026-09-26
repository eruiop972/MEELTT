'use strict';

(() => {
  const data = window.__MELT_STATIC_DATA__ || { products: [], settings: {} };
  const settings = data.settings || {};
  const WHATSAPP = String(settings.whatsapp || '218918510219').replace(/\D/g, '');
  const LOGO = './assets/logo.svg';
  const CART_KEY = 'meltCakeCartV4';
  const VISITOR_KEY = 'meltCakeVisitorV2';

  const categories = [
    ['special-cakes', 'الكيك'],
    ['tiramisu', 'التيراميسو'],
    ['cupcakes', 'الكب كيك'],
    ['cup-cake', 'كيك بالكوب'],
    ['mini-tart', 'الميني تارت'],
    ['trifle', 'الترافل'],
    ['cake-box', 'البوكسات'],
    ['maamoul', 'المعمول']
  ];

  const cakeSizes = [
    { size: '12', serves: 'يكفي من 3 إلى 4 أشخاص', price: 100 },
    { size: '14', serves: 'يكفي من 5 إلى 6 أشخاص', price: 150 },
    { size: '16', serves: 'يكفي من 10 إلى 12 شخصًا', price: 250 },
    { size: '18', serves: 'يكفي 15 شخصًا', price: 300 },
    { size: '20', serves: 'يكفي من 20 إلى 22 شخصًا', price: 400 },
    { size: '22', serves: 'يكفي 25 شخصًا', price: 450 }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (value) => `${Number(value || 0)} د.ل`;
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  let cart = loadCart();
  let selectedSize = cakeSizes[0];

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(item => item && item.id && Number(item.price) >= 0) : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function cartCount() {
    return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  function updateCartBadge() {
    const count = cartCount();
    const badge = $('#cartBadge');
    if (badge) badge.textContent = count;
  }

  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function whatsappUrl(message) {
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  }

  function openWhatsApp(message) {
    window.open(whatsappUrl(message), '_blank', 'noopener');
  }

  function renderCategoryJumps() {
    const host = $('#categoryJumps');
    if (!host) return;
    host.innerHTML = categories.map(([key, label]) => {
      const count = data.products.filter(p => p.visible !== false && p.category === key).length;
      return count ? `<a href="#cat-${key}">${escapeHtml(label)}</a>` : '';
    }).join('');
  }

  function productCard(product) {
    const image = product.image
      ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" width="600" height="600" data-product-image>`
      : `<img src="${LOGO}" alt="شعار Melt Cake" loading="lazy" width="600" height="600" class="logo-fallback">`;
    const badge = product.custom ? '<span class="product-badge">حسب الطلب</span>' : '';
    const extra = product.includes ? escapeHtml(product.includes) : product.custom ? 'التصميم حسب الطلب' : '&nbsp;';
    return `
      <article class="product-card reveal" data-product-id="${escapeHtml(product.id)}">
        <div class="product-media">${image}${badge}</div>
        <div class="product-info">
          <h4>${escapeHtml(product.name)}</h4>
          <div class="product-extra">${extra}</div>
          <div class="price-line"><strong class="price">${money(product.price)}</strong><span class="status-text">${escapeHtml(product.status || 'متوفر')}</span></div>
          <div class="card-controls">
            <div class="qty-control" aria-label="اختيار الكمية">
              <button type="button" data-qty-action="plus" aria-label="زيادة الكمية">+</button>
              <input type="number" min="1" value="1" inputmode="numeric" aria-label="الكمية">
              <button type="button" data-qty-action="minus" aria-label="تقليل الكمية">−</button>
            </div>
            <button type="button" class="add-to-cart">أضيفي للسلة</button>
          </div>
          <button type="button" class="note-toggle">+ ملاحظة للطلب</button>
          <div class="note-wrap"><textarea maxlength="180" placeholder="ملاحظة اختيارية"></textarea></div>
        </div>
      </article>`;
  }

  function renderProducts() {
    const host = $('#productSections');
    if (!host) return;
    host.innerHTML = categories.map(([key, label]) => {
      const products = data.products.filter(p => p.visible !== false && p.category === key);
      if (!products.length) return '';
      return `
        <section class="product-group" id="cat-${key}">
          <div class="group-head"><h3>${escapeHtml(label)}</h3><span>${products.length} ${products.length === 1 ? 'صنف' : 'أصناف'}</span></div>
          <div class="product-grid">${products.map(productCard).join('')}</div>
        </section>`;
    }).join('');

    $$('[data-product-image]').forEach(img => {
      img.addEventListener('error', () => {
        img.src = LOGO;
        img.classList.add('logo-fallback');
      }, { once: true });
    });

    $$('.product-card').forEach(card => {
      const product = data.products.find(p => p.id === card.dataset.productId);
      const input = $('input[type="number"]', card);
      $('[data-qty-action="plus"]', card).addEventListener('click', () => input.value = Math.max(1, (Number(input.value) || 1) + 1));
      $('[data-qty-action="minus"]', card).addEventListener('click', () => input.value = Math.max(1, (Number(input.value) || 1) - 1));
      $('.note-toggle', card).addEventListener('click', (event) => {
        const wrap = $('.note-wrap', card);
        const open = wrap.classList.toggle('open');
        event.currentTarget.textContent = open ? '− إخفاء الملاحظة' : '+ ملاحظة للطلب';
        if (open) $('textarea', wrap).focus();
      });
      $('.add-to-cart', card).addEventListener('click', () => {
        const quantity = Math.max(1, Number(input.value) || 1);
        const note = $('.note-wrap textarea', card).value.trim();
        addCartItem({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image || LOGO,
          quantity,
          note,
          custom: Boolean(product.custom)
        });
        input.value = 1;
        $('.note-wrap textarea', card).value = '';
        $('.note-wrap', card).classList.remove('open');
        $('.note-toggle', card).textContent = '+ ملاحظة للطلب';
        toast('تمت الإضافة للسلة');
      });
    });
  }

  function addCartItem(item) {
    const key = `${item.id}::${item.note || ''}`;
    const existing = cart.find(entry => `${entry.id}::${entry.note || ''}` === key);
    if (existing) existing.quantity += item.quantity;
    else cart.push(item);
    saveCart();
  }

  function renderSizeCards() {
    const host = $('#sizeGrid');
    if (!host) return;
    host.innerHTML = cakeSizes.map((item, index) => `
      <button class="size-card${index === 0 ? ' selected' : ''}" type="button" data-size="${item.size}">
        <strong>مقاس ${item.size}</strong>
        <span>${item.serves}</span>
        <b>${money(item.price)}</b>
      </button>`).join('');
    $$('.size-card', host).forEach(button => button.addEventListener('click', () => {
      selectedSize = cakeSizes.find(item => item.size === button.dataset.size) || cakeSizes[0];
      $$('.size-card', host).forEach(el => el.classList.toggle('selected', el === button));
    }));
  }

  function renderFaq() {
    const faq = $('#faq');
    if (!faq) return;
    faq.innerHTML = (settings.faqs || []).map(([q, a]) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('');
  }

  function setupCustomCake() {
    $('#addCustomCake').addEventListener('click', () => {
      const quantity = Math.max(1, Number($('#customQty').value) || 1);
      const date = $('#customDate').value;
      const notes = $('#customNotes').value.trim();
      const details = [selectedSize.serves, date ? `تاريخ الاستلام: ${date}` : '', notes ? `التصميم: ${notes}` : ''].filter(Boolean).join(' — ');
      addCartItem({
        id: `custom-cake-${selectedSize.size}`,
        name: `تورتة مخصصة - مقاس ${selectedSize.size}`,
        price: selectedSize.price,
        image: LOGO,
        quantity,
        note: details,
        custom: true
      });
      $('#customQty').value = 1;
      $('#customNotes').value = '';
      toast('تمت إضافة التورتة للسلة');
    });
  }

  function cartTotal() {
    return cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  }

  function renderCart() {
    const host = $('#cartItems');
    if (!host) return;
    if (!cart.length) {
      host.innerHTML = '<div class="cart-empty">السلة فاضية حاليًا. اختاري اللي يعجبك من المنتجات.</div>';
    } else {
      host.innerHTML = cart.map((item, index) => `
        <div class="cart-row" data-index="${index}">
          <div class="cart-thumb"><img src="${escapeHtml(item.image || LOGO)}" alt="${escapeHtml(item.name)}" class="${item.image === LOGO ? 'logo-fallback' : ''}"></div>
          <div>
            <h4>${escapeHtml(item.name)}</h4>
            ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}
            <div class="line-price">${money(Number(item.price) * Number(item.quantity))}</div>
          </div>
          <div class="cart-row-controls">
            <div class="mini-qty"><button type="button" data-action="plus" aria-label="زيادة">+</button><span>${item.quantity}</span><button type="button" data-action="minus" aria-label="تقليل">−</button></div>
            <button type="button" class="remove-item" data-action="remove">حذف</button>
          </div>
        </div>`).join('');
      $$('.cart-row img', host).forEach(img => img.addEventListener('error', () => { img.src = LOGO; img.classList.add('logo-fallback'); }, { once: true }));
      $$('.cart-row', host).forEach(row => {
        const index = Number(row.dataset.index);
        $('[data-action="plus"]', row).addEventListener('click', () => { cart[index].quantity += 1; saveCart(); renderCart(); });
        $('[data-action="minus"]', row).addEventListener('click', () => {
          cart[index].quantity -= 1;
          if (cart[index].quantity <= 0) cart.splice(index, 1);
          saveCart(); renderCart();
        });
        $('[data-action="remove"]', row).addEventListener('click', () => { cart.splice(index, 1); saveCart(); renderCart(); });
      });
    }
    $('#cartTotal').textContent = money(cartTotal());
  }

  function openCart() {
    renderCart();
    const dialog = $('#cartDialog');
    if (!dialog.open) dialog.showModal();
  }

  function setupCart() {
    $('#openCart').addEventListener('click', openCart);
    $('#openCartBottom').addEventListener('click', openCart);
    $('#closeCart').addEventListener('click', () => $('#cartDialog').close());
    $('#cartDialog').addEventListener('click', (event) => {
      if (event.target === $('#cartDialog')) $('#cartDialog').close();
    });
    $('#fulfillment').addEventListener('change', () => {
      $('#areaField').style.display = $('#fulfillment').value === 'delivery' ? 'grid' : 'none';
    });
    $('#sendCart').addEventListener('click', () => {
      if (!cart.length) return toast('السلة فاضية');
      const name = $('#customerName').value.trim();
      const phone = $('#customerPhone').value.trim();
      const fulfillment = $('#fulfillment').value;
      const area = $('#customerArea').value.trim();
      const notes = $('#customerNotes').value.trim();
      if (!name || !phone) return toast('اكتبي الاسم ورقم الهاتف');
      if (fulfillment === 'delivery' && !area) return toast('اكتبي المنطقة أو العنوان');

      const lines = ['مرحباً Melt Cake 💗', 'أرغب في تقديم طلب:', ''];
      cart.forEach(item => {
        lines.push(`${item.name}`);
        lines.push(`الكمية: ${item.quantity}`);
        lines.push(`السعر: ${money(item.price)} × ${item.quantity} = ${money(item.price * item.quantity)}`);
        if (item.note) lines.push(`ملاحظات: ${item.note}`);
        lines.push('');
      });
      lines.push(`الإجمالي: ${money(cartTotal())}`);
      lines.push('التوصيل يُحدد حسب المنطقة.');
      lines.push('');
      lines.push(`الاسم: ${name}`);
      lines.push(`رقم الهاتف: ${phone}`);
      lines.push(`طريقة الاستلام: ${fulfillment === 'delivery' ? 'توصيل داخل بنغازي' : 'استلام'}`);
      if (fulfillment === 'delivery') lines.push(`المنطقة / العنوان: ${area}`);
      if (notes) lines.push(`ملاحظات إضافية: ${notes}`);
      if (cart.some(item => item.custom)) {
        lines.push('');
        lines.push('بعد ما نرسل الطلب، بنبعت صورة التصميم على واتساب بشكل منفصل 💗');
      }
      lines.push('');
      lines.push('يرجى تأكيد توفر الطلب والتكلفة النهائية.');
      openWhatsApp(lines.join('\n'));
    });
  }

  function setupBooking() {
    $('#bookingForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries(form.entries());
      const message = [
        'مرحباً Melt Cake 💗',
        'أرغب في حجز طلب.',
        `تاريخ الحجز: ${values.date}`,
        `رقم هاتف المستلم: ${values.phone}`,
        `الصنف: ${values.item}`,
        `الكمية: ${values.qty}`,
        `موعد الاستلام المطلوب: ${values.pickup}`,
        `تفاصيل التصميم / الملاحظات: ${values.details || 'لا توجد'}`,
        '',
        'أعلم أن الحجز لا يعتبر مؤكداً إلا بعد تحويل قيمة العربون وإرسال صورة إشعار التحويل.',
        'إذا كان هناك تصميم مرجعي، سأرسل صورته على واتساب بشكل منفصل 💗',
        'أرجو تأكيد الطلب.'
      ].join('\n');
      $('#bookingStatus').textContent = 'تم تجهيز طلب الحجز — بانتظار التأكيد.';
      openWhatsApp(message);
    });
  }

  function setupStaticLinks() {
    $$('.whatsapp-link').forEach(link => {
      link.href = whatsappUrl('مرحباً Melt Cake 💗');
      link.target = '_blank';
      link.rel = 'noopener';
    });
    const facebook = $('#facebookLink');
    if (facebook) facebook.href = settings.facebook || '#';
  }

  function setupVisitor() {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    let state = { visitorId: crypto?.randomUUID?.() || String(Date.now()), visitCount: 0, activeDays: [], firstVisit: now.toISOString(), lastVisit: now.toISOString() };
    try {
      const saved = JSON.parse(localStorage.getItem(VISITOR_KEY) || 'null');
      if (saved && saved.visitorId) state = { ...state, ...saved };
    } catch {}
    state.visitCount = Number(state.visitCount || 0) + 1;
    state.activeDays = Array.isArray(state.activeDays) ? state.activeDays : [];
    if (!state.activeDays.includes(day)) state.activeDays.push(day);
    state.lastVisit = now.toISOString();
    localStorage.setItem(VISITOR_KEY, JSON.stringify(state));
    if (state.visitCount >= 3 || state.activeDays.length >= 2) $('#vipBadge')?.classList.add('show');
  }

  function setupReveal() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
    items.forEach(el => observer.observe(el));
  }

  function setupMascotFallbacks() {
    $$('img').forEach(img => {
      if (!img.src.includes('i.ibb.co')) return;
      if (img.closest('.product-media') || img.closest('.cart-thumb')) return;
      img.addEventListener('error', () => img.style.display = 'none', { once: true });
    });
  }

  function init() {
    renderCategoryJumps();
    renderProducts();
    renderSizeCards();
    renderFaq();
    setupCustomCake();
    setupCart();
    setupBooking();
    setupStaticLinks();
    setupVisitor();
    setupMascotFallbacks();
    updateCartBadge();
    requestAnimationFrame(setupReveal);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
