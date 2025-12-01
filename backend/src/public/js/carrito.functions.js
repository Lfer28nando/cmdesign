/* =====================================================
   CARRITO PROFESIONAL - CmDesign
   ===================================================== */

const FREE_SHIPPING_THRESHOLD = 100000;
const API_BASE = '/api/cart';

function getSessionId() {
  let sessionId = localStorage.getItem('cartSessionId');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('cartSessionId', sessionId);
  }
  return sessionId;
}

const CartAPI = {
  getCart: (sessionId) =>
    fetch(`${API_BASE}/${sessionId}`).then(res => res.json()),
  
  addItem: (sessionId, productId, quantity = 1, variant = {}) =>
    fetch(`${API_BASE}/item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, productoId: productId, cantidad: quantity, variant })
    }).then(res => res.json()),
  
  updateItem: (sessionId, itemId, quantity) =>
    fetch(`${API_BASE}/item/${sessionId}/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad: quantity })
    }).then(res => res.json()),
  
  removeItem: (sessionId, itemId) =>
    fetch(`${API_BASE}/item/${sessionId}/${itemId}`, {
      method: 'DELETE'
    }).then(res => res.json()),
  
  applyCoupon: (sessionId, code) =>
    fetch(`${API_BASE}/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, codigo: code })
    }).then(res => res.json()),
  
  removeCoupon: (sessionId, code) =>
    fetch(`${API_BASE}/coupon/${sessionId}/${code}`, {
      method: 'DELETE'
    }).then(res => res.json()),

  calculateShipping: (sessionId, city) =>
    fetch(`${API_BASE}/shipping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, upz: city, barrio: '' })
    }).then(res => res.json()),

  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`/api/products/filter?${query}`).then(res => res.json());
  }
};

async function fetchCart() {
  const sessionId = getSessionId();
  try {
    const res = await CartAPI.getCart(sessionId);
    return res.success ? res.data : null;
  } catch (err) {
    console.error('Error fetching cart:', err);
    return null;
  }
}

function formatPrice(num) {
  return '$' + (num || 0).toLocaleString('es-CO');
}

function updateFreeShippingBar(subtotal) {
  const fill = document.getElementById('freeShippingFill');
  const message = document.getElementById('freeShippingMessage');
  const text = document.getElementById('freeShippingText');
  
  if (!fill || !message) return;

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  
  fill.style.width = `${progress}%`;
  
  if (remaining <= 0) {
    message.textContent = 'Tienes envio gratis';
    if (text) text.classList.add('complete');
    fill.parentElement.parentElement.style.background = 'linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)';
  } else {
    message.innerHTML = `Te faltan <strong>${formatPrice(remaining)}</strong> para envio gratis`;
    if (text) text.classList.remove('complete');
  }
}

let isRendering = false;
let suggestionsLoaded = false;

async function renderCart() {
  if (isRendering) return;
  isRendering = true;
  
  const listContainer = document.getElementById('cartItemsList');
  const emptyContainer = document.getElementById('cartEmpty');
  const loadingEl = document.getElementById('cartLoading');
  
  if (!listContainer) {
    isRendering = false;
    return;
  }

  if (loadingEl) loadingEl.style.display = 'flex';
  if (emptyContainer) emptyContainer.style.display = 'none';

  const cart = await fetchCart();
  
  if (loadingEl) loadingEl.style.display = 'none';
  
  if (!cart || !cart.items || cart.items.length === 0) {
    listContainer.innerHTML = '';
    if (emptyContainer) emptyContainer.style.display = 'flex';
    renderTotals(null);
    updateFreeShippingBar(0);
    if (!suggestionsLoaded) {
      suggestionsLoaded = true;
      loadSuggestions();
    }
    isRendering = false;
    return;
  }

  if (emptyContainer) emptyContainer.style.display = 'none';

  const count = cart.items.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  const countEl = document.getElementById('cartItemCount');
  if (countEl) countEl.textContent = `(${count})`;

  let html = '';
  for (const item of cart.items) {
    html += renderCartItem(item);
  }

  listContainer.innerHTML = html;
  
  const subtotal = cart.totales?.subtotal || 0;
  updateFreeShippingBar(subtotal);
  renderTotals(cart);
  
  if (!suggestionsLoaded) {
    suggestionsLoaded = true;
    loadSuggestions(cart.items);
  }
  
  isRendering = false;
}

function renderCartItem(item) {
  const product = item.productoId || {};
  const image = product.imagenes?.[0] 
    ? `/uploads/imagenes/${product.imagenes[0]}` 
    : '/img/placeholder.jpg';
  const name = product.nombre || 'Producto';
  const price = item.precioUnitario || product.precioBase || 0;
  const variant = item.variant || {};
  const productId = product._id || '';
  const quantity = item.cantidad || 1;

  let variantDisplay = '';
  if (variant.talla) variantDisplay = `Talla: ${variant.talla}`;
  if (variant.color) variantDisplay += variantDisplay ? ` / ${variant.color}` : `Color: ${variant.color}`;

  return `
    <div class="cart-item" data-item-id="${item._id}" data-product-id="${productId}">
      <a href="/producto/${productId}">
        <img src="${image}" alt="${name}" class="cart-item-image" onerror="this.onerror=null;this.src='/img/placeholder.jpg'">
      </a>
      <div class="cart-item-details">
        <span class="cart-item-brand">CmDesign</span>
        <a href="/producto/${productId}" class="cart-item-name">${name}</a>
        ${variantDisplay ? `
          <button class="cart-item-variant" data-item-id="${item._id}" data-product-id="${productId}">
            ${variantDisplay}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        ` : ''}
        <div class="cart-item-prices">
          <span class="cart-item-price">${formatPrice(price * quantity)}</span>
        </div>
      </div>
      <div class="cart-item-actions">
        <button class="cart-item-remove" data-item-id="${item._id}" title="Eliminar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
          </svg>
        </button>
        <div class="cart-qty-controls">
          <button class="cart-qty-btn cart-qty-minus" data-item-id="${item._id}" data-qty="${quantity}">−</button>
          <input type="number" class="cart-qty-input" data-item-id="${item._id}" value="${quantity}" min="1" max="99">
          <button class="cart-qty-btn cart-qty-plus" data-item-id="${item._id}" data-qty="${quantity}">+</button>
        </div>
      </div>
    </div>
  `;
}

function renderTotals(cart) {
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (!cart) {
    document.getElementById('subtotalAmount').textContent = '$0';
    document.getElementById('shippingAmount').textContent = 'Por calcular';
    document.getElementById('discountRow').style.display = 'none';
    document.getElementById('totalAmount').textContent = '$0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  const totales = cart.totales || {};
  const subtotal = totales.subtotal || 0;
  const shipping = totales.costoEnvio || 0;
  const discount = totales.descuentoCupones || 0;
  const total = totales.total || subtotal - discount + shipping;

  document.getElementById('subtotalAmount').textContent = formatPrice(subtotal);
  
  const shippingEl = document.getElementById('shippingAmount');
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingEl.innerHTML = '<span class="cart-shipping-free">GRATIS</span>';
  } else if (shipping > 0) {
    shippingEl.textContent = formatPrice(shipping);
  } else {
    shippingEl.textContent = 'Por calcular';
  }
  
  const discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('discountAmount').textContent = `-${formatPrice(discount)}`;
  } else {
    discountRow.style.display = 'none';
  }
  
  document.getElementById('totalAmount').textContent = formatPrice(total);
  if (checkoutBtn) checkoutBtn.disabled = false;

  renderAppliedCoupon(cart);
}

function renderAppliedCoupon(cart) {
  const appliedSection = document.getElementById('couponApplied');
  const inputGroup = document.querySelector('.cart-coupon-input-group');
  
  if (cart?.cuponAplicado && appliedSection) {
    if (inputGroup) inputGroup.style.display = 'none';
    appliedSection.style.display = 'flex';
    document.getElementById('couponName').textContent = cart.cuponAplicado.codigo || 'DESCUENTO';
    document.getElementById('couponDiscount').textContent = `-${formatPrice(cart.totales?.descuentoCupones || 0)}`;
  } else if (appliedSection) {
    if (inputGroup) inputGroup.style.display = 'flex';
    appliedSection.style.display = 'none';
  }
}

async function updateQuantity(itemId, newQty) {
  if (newQty < 1) {
    return removeItem(itemId);
  }
  const sessionId = getSessionId();
  await CartAPI.updateItem(sessionId, itemId, newQty);
  suggestionsLoaded = true;
  await renderCart();
}

async function removeItem(itemId) {
  const sessionId = getSessionId();
  await CartAPI.removeItem(sessionId, itemId);
  suggestionsLoaded = true;
  await renderCart();
  showToast('Producto eliminado');
}

async function applyCoupon() {
  const input = document.getElementById('couponInput');
  const btn = document.getElementById('applyCouponBtn');
  const code = input?.value?.trim().toUpperCase();
  
  if (!code) {
    showToast('Ingresa un codigo de cupon', 'error');
    return;
  }

  if (btn) btn.disabled = true;
  
  const sessionId = getSessionId();
  const res = await CartAPI.applyCoupon(sessionId, code);
  
  if (btn) btn.disabled = false;
  
  if (res.success) {
    await renderCart();
    showToast('Cupon aplicado', 'success');
  } else {
    const errorEl = document.getElementById('couponError');
    if (errorEl) {
      errorEl.textContent = res.message || 'Cupon invalido';
      errorEl.style.display = 'block';
      setTimeout(() => errorEl.style.display = 'none', 3000);
    }
  }
}

async function removeCoupon() {
  const cart = await fetchCart();
  const code = cart?.cuponAplicado?.codigo || '';
  if (!code) return;
  
  const sessionId = getSessionId();
  await CartAPI.removeCoupon(sessionId, code);
  await renderCart();
  showToast('Cupon eliminado');
}

async function calculateShipping() {
  const citySelect = document.getElementById('shippingCity');
  const city = citySelect?.value;
  
  if (!city) {
    showToast('Selecciona una ciudad', 'error');
    return;
  }

  const resultEl = document.getElementById('shippingResult');
  if (resultEl) resultEl.style.display = 'block';
  
  const priceEl = document.getElementById('shippingPrice');
  if (priceEl) priceEl.textContent = 'Calculando...';

  const sessionId = getSessionId();
  const res = await CartAPI.calculateShipping(sessionId, city);
  
  if (res.success) {
    const cart = await fetchCart();
    const subtotal = cart?.totales?.subtotal || 0;
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const cost = isFreeShipping ? 0 : (res.data?.envio?.costo || 0);
    
    if (priceEl) {
      priceEl.textContent = isFreeShipping ? 'GRATIS' : formatPrice(cost);
      priceEl.classList.toggle('cart-shipping-free', isFreeShipping);
    }
    await renderCart();
  } else if (priceEl) {
    priceEl.textContent = 'No disponible';
  }
}

async function loadSuggestions(cartItems = []) {
  const grid = document.getElementById('suggestionsGrid');
  const section = document.getElementById('cartSuggestions');
  if (!grid || !section) return;

  try {
    const res = await CartAPI.getProducts({ limit: 4 });
    if (!res.success || !res.products?.length) {
      section.style.display = 'none';
      return;
    }

    const cartProductIds = cartItems.map(item => item.productoId?._id || '');
    const suggestions = res.products.filter(p => !cartProductIds.includes(p._id)).slice(0, 4);
    
    if (!suggestions.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    grid.innerHTML = suggestions.map(product => {
      const img = product.imagenes?.[0] 
        ? `/uploads/imagenes/${product.imagenes[0]}` 
        : '/img/placeholder.jpg';
      return `
        <a href="/producto/${product._id}" class="cart-suggestion-card">
          <div class="cart-suggestion-image">
            <img src="${img}" alt="${product.nombre}" onerror="this.onerror=null;this.src='/img/placeholder.jpg'">
          </div>
          <div class="cart-suggestion-info">
            <p class="cart-suggestion-name">${product.nombre}</p>
            <p class="cart-suggestion-price">${formatPrice(product.precioBase)}</p>
          </div>
        </a>
      `;
    }).join('');
  } catch (e) {
    section.style.display = 'none';
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('cartToast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `cart-toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

let cachedCartCount = 0;

function updateCartCount(count = null) {
  if (count !== null) {
    cachedCartCount = count;
  }
  document.querySelectorAll('.cart-count, #cart-count, #cartCount').forEach(badge => {
    badge.textContent = cachedCartCount;
    badge.style.display = cachedCartCount > 0 ? 'flex' : 'none';
  });
}

async function refreshCartCount() {
  const cart = await fetchCart();
  const count = cart?.items?.reduce((sum, item) => sum + (item.cantidad || 1), 0) || 0;
  updateCartCount(count);
}

function setupEventListeners() {
  document.getElementById('couponToggle')?.addEventListener('click', () => {
    const body = document.getElementById('couponBody');
    const toggle = document.getElementById('couponToggle');
    if (body && toggle) {
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      toggle.classList.toggle('open', !isOpen);
    }
  });

  document.getElementById('applyCouponBtn')?.addEventListener('click', applyCoupon);
  document.getElementById('removeCouponBtn')?.addEventListener('click', removeCoupon);
  document.getElementById('shippingCity')?.addEventListener('change', calculateShipping);

  document.getElementById('couponInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') applyCoupon();
  });

  document.getElementById('cartItemsList')?.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const itemId = target.dataset.itemId;
    if (!itemId) return;

    if (target.classList.contains('cart-item-remove')) {
      removeItem(itemId);
    } else if (target.classList.contains('cart-qty-minus')) {
      const input = target.parentElement.querySelector('.cart-qty-input');
      const qty = parseInt(input?.value) || 1;
      updateQuantity(itemId, qty - 1);
    } else if (target.classList.contains('cart-qty-plus')) {
      const input = target.parentElement.querySelector('.cart-qty-input');
      const qty = parseInt(input?.value) || 1;
      updateQuantity(itemId, qty + 1);
    }
  });

  document.getElementById('cartItemsList')?.addEventListener('change', (e) => {
    if (e.target.classList.contains('cart-qty-input')) {
      const itemId = e.target.dataset.itemId;
      let qty = parseInt(e.target.value) || 1;
      if (qty < 1) qty = 1;
      if (qty > 99) qty = 99;
      e.target.value = qty;
      updateQuantity(itemId, qty);
    }
  });

  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    window.location.href = '/checkout';
  });

  document.getElementById('closeVariantModal')?.addEventListener('click', () => {
    document.getElementById('variantModal').style.display = 'none';
  });

  document.getElementById('cancelVariantBtn')?.addEventListener('click', () => {
    document.getElementById('variantModal').style.display = 'none';
  });
}

window.CartManager = {
  addToCart: async (productId, quantity = 1, variant = {}) => {
    const sessionId = getSessionId();
    const res = await CartAPI.addItem(sessionId, productId, quantity, variant);
    if (res.success) {
      refreshCartCount();
      showToast('Agregado al carrito', 'success');
    } else {
      showToast(res.message || 'Error al agregar', 'error');
    }
    return res;
  },
  updateCartCount: refreshCartCount,
  getSessionId,
  getCartData: fetchCart,
  renderCart,
  showToast
};

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  if (document.getElementById('cartItemsList')) {
    renderCart();
  } else {
    refreshCartCount();
  }
});
