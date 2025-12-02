// catalogo.js - Catalogo profesional CmDesign con filtros dinamicos y URL params
import { API } from '/js/api.functions.js';

const STATE = {
  products: [],
  totalProducts: 0,
  currentPage: 1,
  limit: 24,
  sort: 'ventas',
  filters: {
    categoria: [],
    subcategoria: [],
    edad: [],
    genero: [],
    marca: [],
    personaje: [],
    talla: [],
    minPrice: 0,
    maxPrice: 500000,
    search: ''
  },
  categories: {},
  allSubcategorias: [],
  gridCols: 4,
  loadedCount: 0
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const formatPrice = price => {
  if (!price && price !== 0) return '';
  return '$' + Math.round(price).toLocaleString('es-CO');
};

const calcDiscount = (original, current) => {
  if (!original || !current || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
};

const escapeHtml = (str = '') => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const createStars = (rating = 0) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
};

const getAvgRating = (calificaciones = []) => {
  if (!calificaciones.length) return 0;
  return calificaciones.reduce((sum, c) => sum + (c.estrellas || 0), 0) / calificaciones.length;
};

// URL Params Sync
function getFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  
  STATE.currentPage = parseInt(params.get('page')) || 1;
  STATE.sort = params.get('sort') || 'ventas';
  STATE.filters.minPrice = parseInt(params.get('minPrice')) || 0;
  STATE.filters.maxPrice = parseInt(params.get('maxPrice')) || 500000;
  STATE.filters.search = params.get('search') || '';
  
  ['categoria', 'subcategoria', 'edad', 'genero', 'marca', 'personaje', 'talla'].forEach(key => {
    const val = params.get(key);
    STATE.filters[key] = val ? val.split(',').filter(Boolean) : [];
  });
}

function updateURL() {
  const params = new URLSearchParams();
  
  if (STATE.currentPage > 1) params.set('page', STATE.currentPage);
  if (STATE.sort !== 'ventas') params.set('sort', STATE.sort);
  if (STATE.filters.minPrice > 0) params.set('minPrice', STATE.filters.minPrice);
  if (STATE.filters.maxPrice < 500000) params.set('maxPrice', STATE.filters.maxPrice);
  if (STATE.filters.search) params.set('search', STATE.filters.search);
  
  ['categoria', 'subcategoria', 'edad', 'genero', 'marca', 'personaje', 'talla'].forEach(key => {
    if (STATE.filters[key].length) params.set(key, STATE.filters[key].join(','));
  });
  
  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);
}

// Load categories from API
async function loadCategories() {
  try {
    const { data } = await API.get('/api/categories');
    if (data?.ok) {
      STATE.categories = data.data || {};
      STATE.allSubcategorias = STATE.categories.subcategoria || [];
      renderFilterMenus();
    }
  } catch (err) {
    console.error('Error loading categories:', err);
    STATE.categories = {
      categoria: [],
      subcategoria: [],
      edad: [{ nombre: 'Adulto' }, { nombre: 'Nino' }, { nombre: 'Bebe' }],
      genero: [{ nombre: 'Hombre' }, { nombre: 'Mujer' }, { nombre: 'Unisex' }],
      marca: [],
      personaje: [],
      talla: [{ nombre: 'XS' }, { nombre: 'S' }, { nombre: 'M' }, { nombre: 'L' }, { nombre: 'XL' }, { nombre: 'XXL' }]
    };
    STATE.allSubcategorias = [];
    renderFilterMenus();
  }
}

function getFilteredSubcategorias() {
  if (!STATE.filters.categoria.length) {
    return [];
  }
  
  const selectedCatIds = (STATE.categories.categoria || [])
    .filter(c => STATE.filters.categoria.includes(c.nombre))
    .map(c => c._id);
  
  return (STATE.allSubcategorias || []).filter(sub => {
    if (!sub.padre) return false;
    const padreId = typeof sub.padre === 'object' ? sub.padre._id : sub.padre;
    return selectedCatIds.includes(padreId) || selectedCatIds.includes(String(padreId));
  });
}

function renderFilterMenus() {
  const filterTypes = ['categoria', 'subcategoria', 'edad', 'genero', 'marca', 'personaje', 'talla'];
  
  filterTypes.forEach(type => {
    let items = STATE.categories[type] || [];
    const isSubcategoria = type === 'subcategoria';
    const subcatDisabled = isSubcategoria && STATE.filters.categoria.length === 0;
    
    if (isSubcategoria) {
      items = getFilteredSubcategorias();
    }
    
    const menuDesktop = $(`#cmMenu${capitalize(type)}`);
    const menuMobile = $(`#cmMobile${capitalize(type)}`);
    const dropdownDesktop = menuDesktop?.closest('.cm-filter-dropdown');
    const dropdownMobile = menuMobile?.closest('.cm-filter-section');
    
    if (isSubcategoria) {
      if (dropdownDesktop) dropdownDesktop.classList.toggle('disabled', subcatDisabled);
      if (dropdownMobile) dropdownMobile.classList.toggle('disabled', subcatDisabled);
    }
    
    if (subcatDisabled) {
      const msg = '<p class="cm-filter-empty">Primero selecciona una categoría</p>';
      if (menuDesktop) menuDesktop.innerHTML = msg;
      if (menuMobile) menuMobile.innerHTML = msg;
      return;
    }
    
    if (!items.length) {
      const emptyMsg = '<p class="cm-filter-empty">Sin opciones</p>';
      if (menuDesktop) menuDesktop.innerHTML = emptyMsg;
      if (menuMobile) menuMobile.innerHTML = emptyMsg;
      return;
    }
    
    const html = items.map(item => {
      const checked = STATE.filters[type].includes(item.nombre) ? 'checked' : '';
      return `
        <label class="cm-filter-option">
          <input type="checkbox" value="${escapeHtml(item.nombre)}" data-filter="${type}" ${checked}>
          <span>${escapeHtml(item.nombre)}</span>
        </label>
      `;
    }).join('');
    
    if (menuDesktop) menuDesktop.innerHTML = html;
    if (menuMobile) menuMobile.innerHTML = html;
  });
  
  attachFilterEvents();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Product card HTML
function createProductCard(product) {
  const images = product.imagenes || [];
  const mainImg = images[0] ? `/uploads/imagenes/${images[0]}` : 'https://placehold.co/300x400/f5f5f5/999?text=Sin+imagen';
  
  const precioOriginal = product.precioOriginal || product.precioBase * 1.3;
  const precioActual = product.precioBase || 0;
  const descuento = calcDiscount(precioOriginal, precioActual);
  
  const coleccion = product.coleccion || product.categoria || '';
  const marca = product.marca || '';
  const nombre = product.nombre || 'Producto';
  
  // Tallas fijas S M L XL XXL - se marca como disabled si no está disponible
  const tallasBase = ['S', 'M', 'L', 'XL', 'XXL'];
  const tallasProducto = product.tallasDisponibles || [];
  const avgRating = getAvgRating(product.calificaciones);
  const ratingCount = (product.calificaciones || []).length;

  const imageDots = images.slice(0, 5).map((_, i) => 
    `<span class="cm-image-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
  ).join('');

  const imageNavZones = images.slice(0, 5).map((_, i) => 
    `<div class="cm-image-nav-zone" data-index="${i}"></div>`
  ).join('');

  const imagesHtml = images.slice(0, 5).map((img, i) => 
    `<img src="/uploads/imagenes/${img}" alt="${escapeHtml(nombre)}" class="${i === 0 ? 'active' : ''}" data-index="${i}" loading="lazy">`
  ).join('') || `<img src="${mainImg}" alt="${escapeHtml(nombre)}" class="active" data-index="0" loading="lazy">`;

  return `
    <article class="cm-product-card" data-id="${product._id}">
      <div class="cm-product-image-wrapper">
        ${descuento > 0 ? `<span class="cm-badge-discount">- ${descuento} %</span>` : ''}
        ${coleccion ? `<span class="cm-badge-collection">${escapeHtml(coleccion)}</span>` : ''}
        
        <button class="cm-wishlist-btn" data-id="${product._id}" aria-label="Agregar a favoritos">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>

        <div class="cm-product-images">${imagesHtml}</div>

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
          ${tallasBase.map(t => {
            const disponible = tallasProducto.length === 0 || tallasProducto.includes(t);
            return `<button class="cm-size-btn ${!disponible ? 'disabled' : ''}" data-size="${t}" ${!disponible ? 'disabled' : ''}>${t}</button>`;
          }).join('')}
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
            <span class="cm-rating-count">${ratingCount}</span>
          </div>
        ` : ''}
      </div>

      <button class="cm-add-cart-btn" data-id="${product._id}">Agregar al carrito</button>
    </article>
  `;
}

// Load products
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
    STATE.loadedCount = 0;
  }

  try {
    const params = new URLSearchParams({
      page: STATE.currentPage,
      limit: STATE.limit,
      sort: STATE.sort,
      minPrice: STATE.filters.minPrice,
      maxPrice: STATE.filters.maxPrice,
      availability: 'true'
    });

    if (STATE.filters.search) params.set('search', STATE.filters.search);
    if (STATE.filters.categoria.length) params.set('categories', STATE.filters.categoria.join(','));
    if (STATE.filters.subcategoria.length) params.set('subcategoria', STATE.filters.subcategoria.join(','));
    if (STATE.filters.edad.length) params.set('edad', STATE.filters.edad.join(','));
    if (STATE.filters.genero.length) params.set('genero', STATE.filters.genero.join(','));
    if (STATE.filters.marca.length) params.set('marca', STATE.filters.marca.join(','));
    if (STATE.filters.personaje.length) params.set('personaje', STATE.filters.personaje.join(','));
    if (STATE.filters.talla.length) params.set('talla', STATE.filters.talla.join(','));

    const { data } = await API.get(`/api/products/filter?${params}`);
    
    if (data?.ok) {
      const products = data.data?.products || [];
      STATE.products = append ? [...STATE.products, ...products] : products;
      STATE.totalProducts = data.data?.total || 0;
      STATE.loadedCount = STATE.products.length;

      renderProducts(append);
      updateProgress();
      updateProductCount();
      updateActiveFilters();
      updateURL();
    } else {
      showEmpty('Error al cargar productos');
    }
  } catch (err) {
    console.error('Error loading products:', err);
    showEmpty('Error de conexion');
  }
}

function renderProducts(append = false) {
  const grid = $('#cmProductsGrid');
  if (!grid) return;

  if (STATE.products.length === 0) {
    showEmpty('No se encontraron productos');
    return;
  }

  const html = STATE.products.map(p => createProductCard(p)).join('');
  
  if (append) {
    const loading = grid.querySelector('.cm-loading');
    if (loading) loading.remove();
    grid.insertAdjacentHTML('beforeend', html);
  } else {
    grid.innerHTML = html;
  }

  attachCardEvents();
  syncWishlistState();
}

function showEmpty(message = 'No hay productos') {
  const grid = $('#cmProductsGrid');
  if (!grid) return;
  
  grid.innerHTML = `
    <div class="cm-empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <h4>${message}</h4>
      <p>Intenta cambiar los filtros de busqueda</p>
      <button class="cm-empty-btn" onclick="window.cmClearFilters()">Limpiar filtros</button>
    </div>
  `;
}

function updateProgress() {
  const fill = $('#cmProgressFill');
  const shown = $('#cmShownCount');
  const total = $('#cmTotalCount');
  const btn = $('#cmLoadMoreBtn');
  const mobileCount = $('#cmMobileResultCount');

  if (fill) {
    const pct = STATE.totalProducts > 0 ? (STATE.loadedCount / STATE.totalProducts) * 100 : 0;
    fill.style.width = `${Math.min(pct, 100)}%`;
  }

  if (shown) shown.textContent = STATE.loadedCount;
  if (total) total.textContent = STATE.totalProducts;
  if (mobileCount) mobileCount.textContent = STATE.totalProducts;
  
  if (btn) {
    btn.disabled = STATE.loadedCount >= STATE.totalProducts;
    btn.textContent = STATE.loadedCount >= STATE.totalProducts ? 'NO HAY MAS PRODUCTOS' : 'VER MAS';
  }
}

function updateProductCount() {
  const count = $('#cmProductCount');
  if (count) count.textContent = STATE.totalProducts;
}

function updateActiveFilters() {
  const container = $('#cmActiveFilters');
  const list = $('#cmActiveFiltersList');
  if (!container || !list) return;

  const activeFilters = [];
  
  ['categoria', 'subcategoria', 'edad', 'genero', 'marca', 'personaje', 'talla'].forEach(key => {
    STATE.filters[key].forEach(val => {
      activeFilters.push({ key, val, label: `${capitalize(key)}: ${val}` });
    });
  });
  
  if (STATE.filters.minPrice > 0 || STATE.filters.maxPrice < 500000) {
    activeFilters.push({ 
      key: 'price', 
      val: 'range',
      label: `Precio: ${formatPrice(STATE.filters.minPrice)} - ${formatPrice(STATE.filters.maxPrice)}`
    });
  }

  if (activeFilters.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  list.innerHTML = activeFilters.map(f => `
    <button class="cm-active-filter-tag" data-key="${f.key}" data-val="${f.val}">
      ${f.label}
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  `).join('');

  list.querySelectorAll('.cm-active-filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const { key, val } = tag.dataset;
      if (key === 'price') {
        STATE.filters.minPrice = 0;
        STATE.filters.maxPrice = 500000;
        syncPriceInputs();
      } else {
        STATE.filters[key] = STATE.filters[key].filter(v => v !== val);
        if (key === 'categoria') {
          STATE.filters.subcategoria = [];
          renderFilterMenus();
        }
        syncFilterCheckboxes();
      }
      STATE.currentPage = 1;
      loadProducts();
    });
  });
}

function syncPriceInputs() {
  const minDesktop = $('#cmPriceMin');
  const maxDesktop = $('#cmPriceMax');
  const minMobile = $('#cmMobilePriceMin');
  const maxMobile = $('#cmMobilePriceMax');
  const minDisplay = $('#cmMinPriceDisplay');
  const maxDisplay = $('#cmMaxPriceDisplay');

  if (minDesktop) minDesktop.value = STATE.filters.minPrice;
  if (maxDesktop) maxDesktop.value = STATE.filters.maxPrice;
  if (minMobile) minMobile.value = STATE.filters.minPrice;
  if (maxMobile) maxMobile.value = STATE.filters.maxPrice;
  if (minDisplay) minDisplay.textContent = STATE.filters.minPrice.toLocaleString('es-CO');
  if (maxDisplay) maxDisplay.textContent = STATE.filters.maxPrice.toLocaleString('es-CO');
}

function syncFilterCheckboxes() {
  $$('[data-filter]').forEach(checkbox => {
    const type = checkbox.dataset.filter;
    const value = checkbox.value;
    checkbox.checked = STATE.filters[type]?.includes(value) || false;
  });
}

// Events
function attachFilterEvents() {
  $$('[data-filter]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const type = e.target.dataset.filter;
      const value = e.target.value;
      
      if (e.target.checked) {
        if (!STATE.filters[type].includes(value)) {
          STATE.filters[type].push(value);
        }
      } else {
        STATE.filters[type] = STATE.filters[type].filter(v => v !== value);
      }
      
      if (type === 'categoria') {
        STATE.filters.subcategoria = [];
        renderFilterMenus();
      }
      
      STATE.currentPage = 1;
      loadProducts();
    });
  });
}

function attachCardEvents() {
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

  $$('.cm-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(btn);
    });
  });

  $$('.cm-size-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('.cm-product-card');
      card.querySelectorAll('.cm-size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  $$('.cm-add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.id);
    });
  });

  $$('.cm-product-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = `/producto/${card.dataset.id}`;
    });
  });
}

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

function changeProductImage(card, index) {
  if (!card) return;
  const images = card.querySelectorAll('.cm-product-images img');
  const dots = card.querySelectorAll('.cm-image-dot');
  images.forEach((img, i) => img.classList.toggle('active', i === index));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
}

function toggleWishlist(btn) {
  btn.classList.toggle('active');
  const productId = btn.dataset.id;
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const idx = wishlist.indexOf(productId);
  if (idx > -1) wishlist.splice(idx, 1);
  else wishlist.push(productId);
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

async function addToCart(productId) {
  try {
    const CartManager = window.CartManager;
    if (!CartManager) {
      showToast('Sistema de carrito no disponible', 'error');
      return;
    }
    const result = await CartManager.addToCart(productId, 1);
    if (result?.success) {
      showToast('Producto agregado al carrito', 'success');
    } else {
      showToast(result?.message || 'Error al agregar', 'error');
    }
  } catch (err) {
    showToast('Error al agregar al carrito', 'error');
  }
}

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

function syncWishlistState() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  $$('.cm-wishlist-btn').forEach(btn => {
    if (wishlist.includes(btn.dataset.id)) btn.classList.add('active');
  });
}

function setGridCols(cols) {
  const grid = $('#cmProductsGrid');
  if (grid) {
    STATE.gridCols = cols;
    grid.dataset.cols = cols;
  }
}

function clearFilters() {
  STATE.filters = {
    categoria: [],
    subcategoria: [],
    edad: [],
    genero: [],
    marca: [],
    personaje: [],
    talla: [],
    minPrice: 0,
    maxPrice: 500000,
    search: ''
  };
  STATE.currentPage = 1;
  syncPriceInputs();
  syncFilterCheckboxes();
  loadProducts();
}

// Mobile drawer
function openMobileDrawer() {
  const overlay = $('#cmFilterOverlay');
  const drawer = $('#cmFilterDrawer');
  if (overlay) overlay.classList.add('active');
  if (drawer) drawer.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobileDrawer() {
  const overlay = $('#cmFilterOverlay');
  const drawer = $('#cmFilterDrawer');
  if (overlay) overlay.classList.remove('active');
  if (drawer) drawer.classList.remove('active');
  document.body.style.overflow = '';
}

// Init events
function initEvents() {
  // Dropdown toggles
  $$('.cm-filter-dropdown').forEach(dropdown => {
    const btn = dropdown.querySelector('.cm-filter-btn');
    const menu = dropdown.querySelector('.cm-filter-menu');
    
    if (btn && menu) {
      btn.addEventListener('click', () => {
        $$('.cm-filter-menu').forEach(m => {
          if (m !== menu) m.classList.remove('active');
        });
        menu.classList.toggle('active');
      });
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.cm-filter-dropdown')) {
      $$('.cm-filter-menu').forEach(m => m.classList.remove('active'));
    }
    if (!e.target.closest('.cm-view-toggle')) {
      const colsMenu = $('#cmColsMenu');
      if (colsMenu) colsMenu.classList.remove('active');
    }
    if (!e.target.closest('.cm-sort-dropdown')) {
      const sortMenu = $('#cmSortMenu');
      if (sortMenu) sortMenu.classList.remove('active');
    }
  });

  // Grid columns
  const colsBtn = $('#cmColsBtn');
  const colsMenu = $('#cmColsMenu');
  if (colsBtn && colsMenu) {
    colsBtn.addEventListener('click', () => colsMenu.classList.toggle('active'));
    colsMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        setGridCols(btn.dataset.cols);
        colsMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        colsMenu.classList.remove('active');
      });
    });
  }

  // Sort
  const sortBtn = $('#cmSortBtn');
  const sortMenu = $('#cmSortMenu');
  const sortLabel = $('#cmSortLabel');
  if (sortBtn && sortMenu) {
    sortBtn.addEventListener('click', () => sortMenu.classList.toggle('active'));
    sortMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.sort = btn.dataset.sort;
        STATE.currentPage = 1;
        sortMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (sortLabel) sortLabel.textContent = btn.textContent;
        sortMenu.classList.remove('active');
        loadProducts();
      });
    });
  }

  // Price inputs
  const priceMin = $('#cmPriceMin');
  const priceMax = $('#cmPriceMax');
  const minDisplay = $('#cmMinPriceDisplay');
  const maxDisplay = $('#cmMaxPriceDisplay');

  if (priceMin) {
    priceMin.addEventListener('input', () => {
      STATE.filters.minPrice = parseInt(priceMin.value) || 0;
      if (minDisplay) minDisplay.textContent = STATE.filters.minPrice.toLocaleString('es-CO');
    });
  }
  if (priceMax) {
    priceMax.addEventListener('input', () => {
      STATE.filters.maxPrice = parseInt(priceMax.value) || 500000;
      if (maxDisplay) maxDisplay.textContent = STATE.filters.maxPrice.toLocaleString('es-CO');
    });
  }

  const applyPrice = $('#cmApplyPrice');
  if (applyPrice) {
    applyPrice.addEventListener('click', () => {
      STATE.currentPage = 1;
      loadProducts();
    });
  }

  // Load more
  const loadMoreBtn = $('#cmLoadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      if (STATE.loadedCount < STATE.totalProducts) {
        STATE.currentPage++;
        loadProducts(true);
      }
    });
  }

  // Clear filters
  const clearBtn = $('#cmClearFilters');
  if (clearBtn) clearBtn.addEventListener('click', clearFilters);

  // Mobile drawer
  const mobileBtn = $('#cmMobileFilterBtn');
  const mobileClose = $('#cmFilterClose');
  const overlay = $('#cmFilterOverlay');
  const mobileApply = $('#cmMobileApplyFilters');
  const mobileClear = $('#cmMobileClearFilters');

  if (mobileBtn) mobileBtn.addEventListener('click', openMobileDrawer);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileDrawer);
  if (overlay) overlay.addEventListener('click', closeMobileDrawer);
  if (mobileApply) mobileApply.addEventListener('click', () => {
    // Sync mobile price inputs
    const min = $('#cmMobilePriceMin');
    const max = $('#cmMobilePriceMax');
    if (min) STATE.filters.minPrice = parseInt(min.value) || 0;
    if (max) STATE.filters.maxPrice = parseInt(max.value) || 500000;
    syncPriceInputs();
    closeMobileDrawer();
    STATE.currentPage = 1;
    loadProducts();
  });
  if (mobileClear) mobileClear.addEventListener('click', () => {
    clearFilters();
    closeMobileDrawer();
  });

  // Mobile section toggles
  $$('.cm-filter-section-title[data-toggle]').forEach(title => {
    title.addEventListener('click', () => {
      const section = title.closest('.cm-filter-section');
      section.classList.toggle('collapsed');
    });
  });
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  getFiltersFromURL();
  syncPriceInputs();
  await loadCategories();
  syncFilterCheckboxes();
  initEvents();
  loadProducts();
});

// Exports
window.cmClearFilters = clearFilters;
window.cmSetGridCols = setGridCols;
