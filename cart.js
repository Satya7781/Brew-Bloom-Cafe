/* ============================================================
   BREW & BLOOM — cart.js
   Full cart: localStorage persistence, drawer, qty controls,
   add-to-cart buttons, order summary, checkout modal
   ============================================================ */

(function () {
  'use strict';

  /* ── Storage key ── */
  const STORAGE_KEY = 'bb_cart_v1';

  /* ══════════════════════════════════════════
     STATE — load from localStorage
  ══════════════════════════════════════════ */
  let cart = [];

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      cart = raw ? JSON.parse(raw) : [];
    } catch (_) {
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (_) { /* storage full — silent */ }
  }

  /* ══════════════════════════════════════════
     CART OPERATIONS
  ══════════════════════════════════════════ */

  /* Returns slug key from item name */
  function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  function addItem(name, price, img) {
    const id   = slugify(name);
    const idx  = cart.findIndex(i => i.id === id);
    if (idx > -1) {
      cart[idx].qty += 1;
    } else {
      cart.push({ id, name, price: parseFloat(price), img, qty: 1 });
    }
    saveCart();
    renderCart();
    bumpBadge();
  }

  function changeQty(id, delta) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx === -1) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    saveCart();
    renderCart();
  }

  function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
    renderCart();
  }

  /* ── Totals ── */
  function getTotalQty()    { return cart.reduce((s, i) => s + i.qty, 0); }
  function getSubtotal()    { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
  function getServiceFee()  { return getSubtotal() * 0.10; }
  function getGrandTotal()  { return getSubtotal() + getServiceFee(); }

  function fmt(n) { return '$' + n.toFixed(2); }

  /* ══════════════════════════════════════════
     BADGE
  ══════════════════════════════════════════ */
  function updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const qty = getTotalQty();
    badge.textContent = qty > 99 ? '99+' : qty;
    badge.classList.toggle('visible', qty > 0);
  }

  function bumpBadge() {
    updateBadge();
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    badge.classList.remove('bump');
    /* force reflow so animation restarts */
    void badge.offsetWidth;
    badge.classList.add('bump');
  }

  /* ══════════════════════════════════════════
     RENDER DRAWER
  ══════════════════════════════════════════ */
  function renderCart() {
    const list   = document.getElementById('cartItemsList');
    const footer = document.getElementById('cartFooter');
    const label  = document.getElementById('cartCountLabel');
    if (!list) return;

    updateBadge();

    const qty = getTotalQty();
    if (label) label.textContent = qty > 0 ? `(${qty} item${qty !== 1 ? 's' : ''})` : '';

    if (cart.length === 0) {
      list.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <div>
            <strong>Your cart is empty</strong>
            <p>Head to our menu and add something delicious!</p>
          </div>
          <a href="menu.html" class="btn btn-gold" style="margin-top:0.5rem;" onclick="closeCart()">Browse Menu →</a>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    /* Build item rows */
    list.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img class="cart-item-img"
             src="${item.img}"
             alt="${escHtml(item.name)}"
             loading="lazy"
             onerror="this.style.display='none'" />
        <div class="cart-item-info">
          <div class="cart-item-name">${escHtml(item.name)}</div>
          <div class="cart-item-price">${fmt(item.price)} each</div>
        </div>
        <div class="qty-controls" aria-label="Quantity for ${escHtml(item.name)}">
          <button class="qty-btn remove-btn"
                  data-action="dec" data-id="${item.id}"
                  aria-label="Decrease quantity"
                  type="button">${item.qty === 1 ? '🗑' : '−'}</button>
          <span class="qty-value" aria-label="${item.qty}">${item.qty}</span>
          <button class="qty-btn"
                  data-action="inc" data-id="${item.id}"
                  aria-label="Increase quantity"
                  type="button">+</button>
        </div>
      </div>`).join('');

    /* Update summary */
    const sub  = getSubtotal();
    const svc  = getServiceFee();
    const tot  = getGrandTotal();
    const elSub = document.getElementById('cartSubtotal');
    const elSvc = document.getElementById('cartService');
    const elTot = document.getElementById('cartTotal');
    if (elSub) elSub.textContent = fmt(sub);
    if (elSvc) elSvc.textContent = fmt(svc);
    if (elTot) elTot.textContent = fmt(tot);

    if (footer) footer.style.display = '';

    /* Bind qty buttons */
    list.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id     = btn.dataset.id;
        const action = btn.dataset.action;
        changeQty(id, action === 'inc' ? 1 : -1);
      });
    });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ══════════════════════════════════════════
     DRAWER OPEN / CLOSE
  ══════════════════════════════════════════ */
  function openCart() {
    const drawer  = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (!drawer) return;
    renderCart();
    drawer.classList.add('open');
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    document.documentElement.classList.add('nav-open'); /* scroll lock on <html> */
    /* focus first focusable element */
    const closeBtn = document.getElementById('cartCloseBtn');
    if (closeBtn) closeBtn.focus();
  }

  function closeCart() {
    const drawer  = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (!drawer) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('nav-open'); /* release scroll lock */
    /* return focus to cart button */
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.focus();
  }

  /* ══════════════════════════════════════════
     CHECKOUT
  ══════════════════════════════════════════ */
  function placeOrder() {
    if (cart.length === 0) return;

    /* Generate order reference */
    const ref = 'BB-' + Date.now().toString(36).toUpperCase().slice(-6);
    const modal   = document.getElementById('checkoutModal');
    const refEl   = document.getElementById('orderRef');
    if (refEl)  refEl.textContent = 'Order Ref: ' + ref;
    if (modal)  modal.classList.add('open');

    closeCart();
    clearCart();
  }

  /* ══════════════════════════════════════════
     ADD-TO-CART BUTTON FEEDBACK
  ══════════════════════════════════════════ */
  function handleAddBtn(btn) {
    const card  = btn.closest('[data-name]');
    if (!card) return;
    const name  = card.dataset.name;
    const price = card.dataset.price;
    const img   = card.dataset.img || '';

    addItem(name, price, img);

    /* visual feedback */
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Added';
    btn.classList.add('added');
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1400);
  }

  /* ══════════════════════════════════════════
     INIT — wire up all DOM events
  ══════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    updateBadge();

    /* Cart open button */
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.addEventListener('click', openCart);

    /* Cart close button */
    const closeBtn = document.getElementById('cartCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeCart);

    /* Overlay click closes */
    const overlay = document.getElementById('cartOverlay');
    if (overlay) overlay.addEventListener('click', closeCart);

    /* Clear cart */
    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (confirm('Remove all items from your cart?')) clearCart();
    });

    /* Checkout */
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', placeOrder);

    /* Modal done */
    const modalDone = document.getElementById('modalDoneBtn');
    const modal     = document.getElementById('checkoutModal');
    if (modalDone) modalDone.addEventListener('click', () => {
      if (modal) modal.classList.remove('open');
    });

    /* Close modal on backdrop click */
    if (modal) modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.remove('open');
    });

    /* Escape key closes drawer OR modal */
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const drawer = document.getElementById('cartDrawer');
      if (drawer?.classList.contains('open')) { closeCart(); return; }
      if (modal?.classList.contains('open'))  { modal.classList.remove('open'); }
    });

    /* Drawer swipe-right to close (touch) */
    const drawer = document.getElementById('cartDrawer');
    if (drawer) {
      let _sx = 0;
      drawer.addEventListener('touchstart', e => { _sx = e.touches[0].clientX; }, { passive: true });
      drawer.addEventListener('touchend',   e => {
        if (e.changedTouches[0].clientX - _sx > 70) closeCart();
      }, { passive: true });
    }

    /* Add-to-cart buttons — delegated to document for tab switching */
    document.addEventListener('click', e => {
      const btn = e.target.closest('.add-to-cart-btn');
      if (btn) handleAddBtn(btn);
    });

    /* Initial render (shows badge if cart was in localStorage) */
    renderCart();
  });

  /* Expose closeCart globally (used by empty-state "Browse Menu" link) */
  window.closeCart = closeCart;

})();
