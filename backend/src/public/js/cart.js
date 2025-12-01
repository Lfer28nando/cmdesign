/* =====================================================
   CARRITO PROFESIONAL - CmDesign
   JavaScript completo con envío gratis, cupones, variantes
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
  addToCart: (sessionId, productId, quantity = 1, variant = {}) =>
    fetch(`${API_BASE}/item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, productoId: productId, cantidad: quantity, variant })
    }).then(res => res.json()),
  
  getCart: (sessionId) =>
    fetch(`${API_BASE}/${sessionId}`).then(res => res.json()),
  
  updateItem: (sessionId, itemId, quantity, variant = null) =>
    fetch(`${API_BASE}/item/${sessionId}/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variant ? { cantidad: quantity, variant } : { cantidad: quantity })
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

  calculateShipping: (sessionId, city, neighborhood) =>
    fetch(`${API_BASE}/shipping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, upz: city, barrio: neighborhood })
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
  const bar = document.getElementById('free-shipping-bar');
  if (!bar) return;

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  
  const fill = bar.querySelector('.cart-free-shipping-fill');
  const text = bar.querySelector('.cart-free-shipping-text');
  
  if (fill) fill.style.width = `${progress}%`;
  
  if (text) {
    if (remaining <= 0) {
      text.innerHTML = `<span class="cart-free-shipping-icon">🎉</span> Tienes envio gratis`;
      text.classList.add('complete');
      bar.style.background = 'linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)';
    } else {
      text.innerHTML = `<span class="cart-free-shipping-icon">🚚</span> Te faltan <strong>${formatPrice(remaining)}</strong> para envio gratis`;
      text.classList.remove('complete');
      bar.style.background = 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)';
    }
  }
}

async function renderCart() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  container.innerHTML = `
    <div class="cart-loading">
      <div class="cart-spinner"></div>
      <span>Cargando tu carrito...</span>
    </div>
  `;

  const cart = await fetchCart();
  
  if (!cart || !cart.items || cart.items.length === 0) {
    showEmptyCart(container);
    renderTotals(null);
    updateFreeShippingBar(0);
    loadSuggestions();
    return;
  }

  const count = cart.items.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  const header = document.querySelector('.cart-title');
  if (header) header.innerHTML = `Tu carrito <span>(${count} ${count === 1 ? 'producto' : 'productos'})</span>`;

  let html = '';
  for (const item of cart.items) {
    html += renderCartItem(item);
  }

  container.innerHTML = html;
  
  const subtotal = cart.totales?.subtotal || 0;
  updateFreeShippingBar(subtotal);
  renderTotals(cart);
  loadSuggestions(cart.items);
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
        <img src="${image}" alt="${name}" class="cart-item-image" onerror="this.src='/img/placeholder.jpg'">
      </a>
      <div class="cart-item-details">
        <span class="cart-item-brand">CmDesign</span>
        <a href="/producto/${productId}" class="cart-item-name">${name}</a>
        ${variantDisplay ? `
          <button class="cart-item-variant" onclick="openVariantModal('${item._id}', '${productId}')">
            ${variantDisplay}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        ` : ''}
        <div class="cart-item-prices">
          <span class="cart-item-price">${formatPrice(price * quantity)}</span>
        </div>
      </div>
      <div class="cart-item-actions">
        <button class="cart-item-remove" onclick="removeItem('${item._id}')" title="Eliminar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
          </svg>
        </button>
        <div class="cart-qty-controls">
          <button class="cart-qty-btn" onclick="updateQuantity('${item._id}', ${quantity - 1})">−</button>
          <span class="cart-qty-value">${quantity}</span>
          <button class="cart-qty-btn" onclick="updateQuantity('${item._id}', ${quantity + 1})">+</button>
        </div>
      </div>
    </div>
  `;
}

function showEmptyCart(container) {
  container.innerHTML = `
    <div class="cart-empty">
      <svg class="cart-empty-icon" xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
      <h2>Tu carrito esta vacio</h2>
      <p>Explora nuestra coleccion y encuentra tu estilo</p>
      <a href="/catalogo" class="cart-btn-primary">Ir al catalogo</a>
    </div>
  `;
  
  const summary = document.getElementById('cart-summary');
  if (summary) summary.style.display = 'none';
}

function renderTotals(cart) {
  const summary = document.getElementById('cart-summary');
  if (summary) summary.style.display = cart ? 'block' : 'none';

  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const discountRow = document.getElementById('discount-row');
  const discountEl = document.getElementById('cart-discount');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('btn-checkout');

  if (!cart) {
    if (subtotalEl) subtotalEl.textContent = '$0';
    if (shippingEl) shippingEl.textContent = 'Por calcular';
    if (discountRow) discountRow.style.display = 'none';
    if (totalEl) totalEl.textContent = '$0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  const totales = cart.totales || {};
  const subtotal = totales.subtotal || 0;
  const shipping = totales.costoEnvio || 0;
  const discount = totales.descuentoCupones || 0;
  const total = totales.total || subtotal - discount + shipping;

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  
  if (shippingEl) {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      shippingEl.innerHTML = '<span class="cart-shipping-free">GRATIS</span>';
    } else if (shipping > 0) {
      shippingEl.textContent = formatPrice(shipping);
    } else {
      shippingEl.textContent = 'Por calcular';
    }
  }
  
  if (discountRow && discountEl) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${formatPrice(discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
  
  if (totalEl) totalEl.textContent = formatPrice(total);
  if (checkoutBtn) checkoutBtn.disabled = false;

  renderAppliedCoupon(cart);
}

function renderAppliedCoupon(cart) {
  const appliedSection = document.getElementById('coupon-applied');
  const inputSection = document.getElementById('coupon-input-section');
  
  if (cart?.cuponAplicado && appliedSection && inputSection) {
    inputSection.style.display = 'none';
    appliedSection.style.display = 'flex';
    const codeEl = document.getElementById('applied-coupon-code');
    const discountEl = document.getElementById('coupon-discount-text');
    if (codeEl) codeEl.textContent = cart.cuponAplicado.codigo || '';
    if (discountEl) discountEl.textContent = `-${formatPrice(cart.totales?.descuentoCupones || 0)}`;
  } else if (appliedSection && inputSection) {
    inputSection.style.display = 'flex';
    appliedSection.style.display = 'none';
  }
}

async function updateQuantity(itemId, newQty) {
  if (newQty < 1) {
    return removeItem(itemId);
  }
  const sessionId = getSessionId();
  await CartAPI.updateItem(sessionId, itemId, newQty);
  await renderCart();
  updateCartCount();
}

async function removeItem(itemId) {
  const sessionId = getSessionId();
  await CartAPI.removeItem(sessionId, itemId);
  await renderCart();
  updateCartCount();
  showToast('Producto eliminado');
}

async function applyCoupon() {
  const input = document.getElementById('coupon-input');
  const btn = document.querySelector('.cart-coupon-btn');
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
    showToast('Cupon aplicado correctamente', 'success');
  } else {
    const errorEl = document.getElementById('coupon-error');
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
  const citySelect = document.getElementById('shipping-city');
  const city = citySelect?.value;
  
  if (!city) {
    showToast('Selecciona una ciudad', 'error');
    return;
  }

  const resultEl = document.getElementById('shipping-result');
  if (resultEl) {
    resultEl.innerHTML = '<p style="text-align:center; color:#6b7280;">Calculando...</p>';
    resultEl.style.display = 'block';
  }

  const sessionId = getSessionId();
  const res = await CartAPI.calculateShipping(sessionId, city, '');
  
  if (res.success && resultEl) {
    const cart = await fetchCart();
    const subtotal = cart?.totales?.subtotal || 0;
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const cost = isFreeShipping ? 0 : (res.data?.envio?.costo || 0);
    
    resultEl.innerHTML = `
      <div class="cart-shipping-option">
        <div>
          <strong>Envio estandar</strong>
          <small>3-5 dias habiles</small>
        </div>
        <span class="cart-shipping-price ${isFreeShipping ? 'cart-shipping-free' : ''}">
          ${isFreeShipping ? 'GRATIS' : formatPrice(cost)}
        </span>
      </div>
    `;
    await renderCart();
  } else if (resultEl) {
    resultEl.innerHTML = `<p style="color:#ef4444;">${res.message || 'No hay cobertura en esta zona'}</p>`;
  }
}

async function loadSuggestions(cartItems = []) {
  const grid = document.getElementById('suggestions-grid');
  if (!grid) return;

  try {
    const res = await CartAPI.getProducts({ limit: 4 });
    if (!res.success || !res.products?.length) {
      grid.parentElement.style.display = 'none';
      return;
    }

    const cartProductIds = cartItems.map(item => item.productoId?._id || '');
    const suggestions = res.products.filter(p => !cartProductIds.includes(p._id)).slice(0, 4);
    
    if (!suggestions.length) {
      grid.parentElement.style.display = 'none';
      return;
    }

    grid.innerHTML = suggestions.map(product => {
      const img = product.imagenes?.[0] 
        ? `/uploads/imagenes/${product.imagenes[0]}` 
        : '/img/placeholder.jpg';
      return `
        <a href="/producto/${product._id}" class="cart-suggestion-card">
          <div class="cart-suggestion-image">
            <img src="${img}" alt="${product.nombre}" onerror="this.src='/img/placeholder.jpg'">
          </div>
          <div class="cart-suggestion-info">
            <p class="cart-suggestion-name">${product.nombre}</p>
            <p class="cart-suggestion-price">${formatPrice(product.precioBase)}</p>
          </div>
        </a>
      `;
    }).join('');
  } catch (e) {
    grid.parentElement.style.display = 'none';
  }
}

function toggleCouponSection() {
  const header = document.querySelector('.cart-coupon-header');
  const body = document.getElementById('coupon-body');
  
  if (header && body) {
    header.classList.toggle('open');
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
  }
}

async function openVariantModal(itemId, productId) {
  showToast('Funcion de cambiar variante proximamente', 'info');
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.cart-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `cart-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function updateCartCount() {
  fetchCart().then(cart => {
    const count = cart?.items?.reduce((sum, item) => sum + (item.cantidad || 1), 0) || 0;
    document.querySelectorAll('.cart-count, #cart-count, #cartCount').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  });
}

window.CartManager = {
  addToCart: async (productId, quantity = 1, variant = {}) => {
    const sessionId = getSessionId();
    const res = await CartAPI.addToCart(sessionId, productId, quantity, variant);
    if (res.success) {
      updateCartCount();
      showToast('Agregado al carrito', 'success');
    } else {
      showToast(res.message || 'Error al agregar', 'error');
    }
    return res;
  },
  updateCartCount,
  getSessionId,
  getCartData: fetchCart,
  renderCart,
  showToast
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cart-items-container')) {
    renderCart();
  }
  updateCartCount();

  const couponInput = document.getElementById('coupon-input');
  if (couponInput) {
    couponInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyCoupon();
    });
  }
});
