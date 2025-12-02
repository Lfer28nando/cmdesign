// cm-catalog.js - Catalogo CmDesign
import { API } from '/js/api.functions.js';

const CM_STATE = {
  products: [],
  totalProducts: 0,
  currentPage: 1,
  limit: 24,
  sort: 'ventas',
  filters: {
    subcategoria: [],
    edad: [],
    genero: [],
    marca: [],
    personaje: [],
    talla: [],
    minPrice: 0,
    maxPrice: 500000
  },
  gridCols: 5,
  loadedCount: 0
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Formatear precio colombiano
const formatPrice = (price) => {
  if (!price && price !== 0) return '';
  return '$' + Math.round(price).toLocaleString('es-CO');
};

// Calcular porcentaje de descuento
const calcDiscount = (original, current) => {
  if (!original || !current || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
};

// Escape HTML
const escapeHtml = (str = '') => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Crear estrellas de rating
const createStars = (rating = 0) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
};

// Obtener promedio de calificaciones
const getAvgRating = (calificaciones = []) => {
  if (!calificaciones.length) return 0;
  return calificaciones.reduce((sum, c) => sum + (c.estrellas || 0), 0) / calificaciones.length;
};

// Crear HTML de producto
function createProductCard(product) {
  const images = product.imagenes || [];
  const mainImg = images[0] ? `/uploads/imagenes/${images[0]}` : 'https://placehold.co/300x400/f5f5f5/999?text=Sin+imagen';
  
  const precioOriginal = product.precioOriginal || product.precioBase * 1.3;
  const precioActual = product.precioBase || 0;
  const descuento = calcDiscount(precioOriginal, precioActual);
  
  const coleccion = product.coleccion || product.categoria || '';
  const marca = product.marca || product.grupo || '';
  const nombre = product.nombre || 'Producto';
  
  const tallas = ['S', 'M', 'L', 'XL', 'XXL'];
  const avgRating = getAvgRating(product.calificaciones);
  const ratingCount = (product.calificaciones || []).length;

  // Generar dots para imagenes
  const imageDots = images.slice(0, 5).map((_, i) => 
    `<span class="cm-image-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
  ).join('');

  // Generar zonas de navegacion de imagenes
  const imageNavZones = images.slice(0, 5).map((_, i) => 
    `<div class="cm-image-nav-zone" data-index="${i}"></div>`
  ).join('');

  // Generar imagenes
  const imagesHtml = images.slice(0, 5).map((img, i) => 
    `<img src="/uploads/imagenes/${img}" alt="${escapeHtml(nombre)}" class="${i === 0 ? 'active' : ''}" data-index="${i}" loading="lazy">`
  ).join('') || `<img src="${mainImg}" alt="${escapeHtml(nombre)}" class="active" data-index="0" loading="lazy">`;

  return `
    <article class="cm-product-card" data-id="${product._id}">
      <div class="cm-product-image-wrapper">
        ${descuento > 0 ? `<span class="cm-badge-discount">- ${descuento} %</span>` : ''}
        ${coleccion ? `<span class="cm-badge-collection">${escapeHtml(coleccion)}</span>` : ''}
        
        <button class="cm-wishlist-btn" data-id="${product._id}" aria-label="Agregar a favoritos">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>

        <div class="cm-product-images">
          ${imagesHtml}
        </div>

        ${images.length > 1 ? `
          <button class="cm-img-nav-btn cm-img-prev" aria-label="Imagen anterior">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button class="cm-img-nav-btn cm-img-next" aria-label="Imagen siguiente">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <div class="cm-image-nav">${imageNavZones}</div>
          <div class="cm-image-dots">${imageDots}</div>
        ` : ''}

        <div class="cm-sizes-overlay">
          ${tallas.map(t => `<button class="cm-size-btn" data-size="${t}">${t}</button>`).join('')}
        </div>
      </div>

      <div class="cm-product-info">
        ${marca ? `<p class="cm-product-brand">${escapeHtml(marca)}</p>` : ''}
        <h3 class="cm-product-name">${escapeHtml(nombre)}</h3>
        <div class="cm-product-prices">
          ${descuento > 0 ? `<span class="cm-price-original">${formatPrice(precioOriginal)}</span>` : ''}
          <span class="cm-price-current ${descuento > 0 ? 'cm-price-discount' : ''}">${formatPrice(precioActual)}</span>
        </div>
        ${ratingCount > 0 ? `
          <div class="cm-product-rating">
            <span class="cm-rating-stars">${createStars(avgRating)}</span>
            <span class="cm-rating-count">${ratingCount} opiniones</span>
          </div>
        ` : ''}
      </div>

      <button class="cm-add-cart-btn" data-id="${product._id}">Agregar al carrito</button>
    </article>
  `;
}

// Cargar productos
async function loadProducts(append = false) {
  const grid = $('#cmProductsGrid');
  if (!grid) return;

  if (!append) {
    grid.innerHTML = `
      <div class="cm-loading">
        <div class="cm-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    `;
    CM_STATE.loadedCount = 0;
  }

  try {
    const params = new URLSearchParams({
      page: CM_STATE.currentPage,
      limit: CM_STATE.limit,
      sort: CM_STATE.sort,
      minPrice: CM_STATE.filters.minPrice,
      maxPrice: CM_STATE.filters.maxPrice,
      availability: 'true'
    });

    const { data } = await API.get(`/api/products/filter?${params}`);
    
    if (data?.ok) {
      const products = data.data?.products || [];
      CM_STATE.products = append ? [...CM_STATE.products, ...products] : products;
      CM_STATE.totalProducts = data.data?.total || 0;
      CM_STATE.loadedCount = CM_STATE.products.length;

      renderProducts(append);
      updateProgress();
      updateProductCount();
    } else {
      showEmpty('Error al cargar productos');
    }
  } catch (err) {
    console.error('Error loading products:', err);
    showEmpty('Error de conexión');
  }
}

// Renderizar productos
function renderProducts(append = false) {
  const grid = $('#cmProductsGrid');
  if (!grid) return;

  if (CM_STATE.products.length === 0) {
    showEmpty('No se encontraron productos');
    return;
  }

  const html = CM_STATE.products.map(p => createProductCard(p)).join('');
  
  if (append) {
    const loading = grid.querySelector('.cm-loading');
    if (loading) loading.remove();
    grid.insertAdjacentHTML('beforeend', html);
  } else {
    grid.innerHTML = html;
  }

  attachCardEvents();
}

// Mostrar estado vacio
function showEmpty(message = 'No hay productos') {
  const grid = $('#cmProductsGrid');
  if (!grid) return;
  
  grid.innerHTML = `
    <div class="cm-empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.77L12 20.65l7.65-7.65.77-.77a5.4 5.4 0 0 0 0-7.65Z"/>
      </svg>
      <h4>${message}</h4>
      <p>Intenta cambiar los filtros de búsqueda</p>
    </div>
  `;
}

// Actualizar barra de progreso
function updateProgress() {
  const fill = $('#cmProgressFill');
  const shown = $('#cmShownCount');
  const total = $('#cmTotalCount');
  const btn = $('#cmLoadMoreBtn');

  if (fill) {
    const pct = CM_STATE.totalProducts > 0 
      ? (CM_STATE.loadedCount / CM_STATE.totalProducts) * 100 
      : 0;
    fill.style.width = `${Math.min(pct, 100)}%`;
  }

  if (shown) shown.textContent = CM_STATE.loadedCount;
  if (total) total.textContent = CM_STATE.totalProducts;
  
  if (btn) {
    btn.disabled = CM_STATE.loadedCount >= CM_STATE.totalProducts;
    btn.textContent = CM_STATE.loadedCount >= CM_STATE.totalProducts ? 'NO HAY MÁS PRODUCTOS' : 'VER MÁS';
  }
}

// Actualizar contador
function updateProductCount() {
  const count = $('#cmProductCount');
  if (count) count.textContent = CM_STATE.totalProducts;
}

// Cambiar columnas del grid
function setGridCols(cols) {
  const grid = $('#cmProductsGrid');
  if (grid) {
    CM_STATE.gridCols = cols;
    grid.dataset.cols = cols;
  }
}

// Cambiar ordenamiento
function setSort(sort) {
  CM_STATE.sort = sort;
  CM_STATE.currentPage = 1;
  loadProducts(false);
}

// Cargar mas productos
function loadMore() {
  if (CM_STATE.loadedCount >= CM_STATE.totalProducts) return;
  CM_STATE.currentPage++;
  loadProducts(true);
}

// Eventos de las cards
function attachCardEvents() {
  // Image hover navigation
  $$('.cm-image-nav-zone').forEach(zone => {
    zone.addEventListener('mouseenter', (e) => {
      const card = e.target.closest('.cm-product-card');
      const index = parseInt(e.target.dataset.index);
      changeProductImage(card, index);
    });
  });

  // Image navigation buttons
  $$('.cm-img-prev').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('.cm-product-card');
      navigateImage(card, -1);
    });
  });

  $$('.cm-img-next').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('.cm-product-card');
      navigateImage(card, 1);
    });
  });

  // Wishlist toggle
  $$('.cm-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(btn);
    });
  });

  // Size selection
  $$('.cm-size-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('.cm-product-card');
      card.querySelectorAll('.cm-size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Add to cart
  $$('.cm-add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.id);
    });
  });

  // Card click -> product detail
  $$('.cm-product-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = `/producto/${card.dataset.id}`;
    });
  });
}

// Navigate images with buttons
function navigateImage(card, direction) {
  if (!card) return;
  const images = card.querySelectorAll('.cm-product-images img');
  const dots = card.querySelectorAll('.cm-image-dot');
  if (images.length <= 1) return;
  
  let currentIndex = 0;
  images.forEach((img, i) => { if (img.classList.contains('active')) currentIndex = i; });
  
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = images.length - 1;
  if (newIndex >= images.length) newIndex = 0;
  
  images.forEach((img, i) => img.classList.toggle('active', i === newIndex));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === newIndex));
}

// Cambiar imagen del producto en hover
function changeProductImage(card, index) {
  if (!card) return;
  
  const images = card.querySelectorAll('.cm-product-images img');
  const dots = card.querySelectorAll('.cm-image-dot');
  
  images.forEach((img, i) => img.classList.toggle('active', i === index));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
}

// Toggle wishlist
function toggleWishlist(btn) {
  btn.classList.toggle('active');
  const productId = btn.dataset.id;
  
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const idx = wishlist.indexOf(productId);
  
  if (idx > -1) {
    wishlist.splice(idx, 1);
  } else {
    wishlist.push(productId);
  }
  
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Agregar al carrito
async function addToCart(productId) {
  try {
    const result = await window.CartManager?.addToCart(productId, 1);
    if (result?.success) {
      showToast('Producto agregado al carrito', 'success');
    } else {
      showToast(result?.message || 'Error al agregar', 'error');
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    showToast('Error al agregar al carrito', 'error');
  }
}

// Toast simple
function showToast(message, type = 'info') {
  let container = document.querySelector('.cm-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'cm-toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#333';
  toast.style.cssText = `background:${bgColor};color:#fff;padding:12px 20px;border-radius:4px;margin-bottom:8px;font-size:0.9rem;box-shadow:0 2px 8px rgba(0,0,0,0.2);`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Actualizar precio del slider
function updatePriceRange() {
  const slider = $('#cmPriceRange');
  const maxDisplay = $('#cmMaxPrice');
  
  if (slider && maxDisplay) {
    const value = parseInt(slider.value);
    CM_STATE.filters.maxPrice = value;
    maxDisplay.textContent = value.toLocaleString('es-CO');
  }
}

// Inicializar eventos globales
function initEvents() {
  // Grid columns dropdown
  const colsBtn = $('#cmColsBtn');
  const colsMenu = $('#cmColsMenu');
  
  if (colsBtn && colsMenu) {
    colsBtn.addEventListener('click', () => colsMenu.classList.toggle('active'));
    
    colsMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const cols = btn.dataset.cols;
        setGridCols(cols);
        
        // Mark as active
        colsMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        colsMenu.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.cm-view-toggle')) {
        colsMenu.classList.remove('active');
      }
    });
  }

  // Sort dropdown
  const sortBtn = $('.cm-sort-btn');
  const sortMenu = $('#cmSortMenu');
  
  if (sortBtn && sortMenu) {
    sortBtn.addEventListener('click', () => sortMenu.classList.toggle('active'));
    
    sortMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        setSort(btn.dataset.sort);
        sortMenu.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.cm-sort-dropdown')) {
        sortMenu.classList.remove('active');
      }
    });
  }

  // Price range
  const priceSlider = $('#cmPriceRange');
  if (priceSlider) {
    priceSlider.addEventListener('input', updatePriceRange);
  }

  const priceGo = $('.cm-price-go');
  if (priceGo) {
    priceGo.addEventListener('click', () => {
      CM_STATE.currentPage = 1;
      loadProducts(false);
    });
  }

  // Load more
  const loadMoreBtn = $('#cmLoadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
  }

  // Sync wishlist state on load
  syncWishlistState();
}

// Sincronizar estado de wishlist
function syncWishlistState() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  $$('.cm-wishlist-btn').forEach(btn => {
    if (wishlist.includes(btn.dataset.id)) {
      btn.classList.add('active');
    }
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  loadProducts();
});

// Exports
window.cmSetGridCols = setGridCols;
window.cmSetSort = setSort;
window.cmLoadMore = loadMore;
