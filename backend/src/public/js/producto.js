// producto.js - Vista de detalle de producto profesional
import { API } from './api.functions.js';
import { CartManager } from './cart.js';

// Estado del producto
const state = {
  product: null,
  currentImageIndex: 0,
  selectedVariant: null,
  quantity: 1
};

// Helpers
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

const showToast = (message, type = 'success') => {
  let toast = $('.pdp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'pdp-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `pdp-toast ${type}`;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3000);
};

// Obtener ID del producto desde URL
const getProductId = () => {
  const match = window.location.pathname.match(/\/producto\/(\w+)/);
  return match ? match[1] : null;
};

// Cargar producto principal
async function loadProduct() {
  const productId = getProductId();
  if (!productId) {
    showError('ID de producto no encontrado');
    return;
  }

  try {
    const res = await API.get(`/api/products/${productId}`);
    const product = res.data.product || res.data.data || res.data;
    
    if (!product || !product.nombre) {
      showError('Producto no encontrado');
      return;
    }

    state.product = product;
    renderProduct(product);
    loadRelatedProducts(product);
    loadDiscoverProducts(product);
  } catch (err) {
    console.error('Error cargando producto:', err);
    showError('Error al cargar el producto');
  }
}

// Renderizar producto
function renderProduct(p) {
  // Breadcrumb
  $('#breadcrumbProduct').textContent = p.nombre;
  if (p.categoria) {
    $('#breadcrumbCategory').textContent = p.categoria;
    $('#breadcrumbCategory').href = `/catalogo?categoria=${encodeURIComponent(p.categoria)}`;
  }

  // Marca
  $('#productBrand').textContent = p.marca || p.grupo || 'CMDESIGN';

  // Nombre
  $('#productName').textContent = p.nombre;

  // Rating
  const avgRating = getAvgRating(p.calificaciones);
  const ratingCount = (p.calificaciones || []).length;
  $('#productStars').textContent = createStars(avgRating);
  $('#ratingCount').textContent = `${avgRating.toFixed(1)} - ${ratingCount} opiniones`;

  // Precios
  const precioOriginal = p.precioOriginal || p.precioBase * 1.3;
  const precioActual = p.precioBase || 0;
  const descuento = calcDiscount(precioOriginal, precioActual);

  $('#priceCurrent').textContent = formatPrice(precioActual);
  
  if (descuento > 0) {
    $('#priceOriginal').textContent = formatPrice(precioOriginal);
    $('#priceDiscountBadge').textContent = `-${descuento}%`;
    $('#priceDiscountBadge').style.display = 'inline-block';
    $('#badgeDiscount').style.display = 'block';
    $('#discountText').textContent = `-${descuento}%`;
  }

  // Promo tag (si tiene etiqueta especial)
  if (p.etiquetas?.includes('cyber') || p.etiquetas?.includes('oferta')) {
    $('#promoTag').style.display = 'inline-block';
    $('#promoTag').textContent = p.etiquetas.includes('cyber') ? 'CYBER DAYS' : 'OFERTA';
  }

  // Galería de imágenes
  renderGallery(p.imagenes || []);

  // Variantes - Siempre mostrar (tallas por defecto si no hay variantes)
  renderVariants(p.variantes || []);

  // Descripción
  $('#productDescription').textContent = p.descripcion || 'Sin descripción disponible.';

  // Especificaciones
  renderSpecs(p);

  // SKU
  $('#productSku').textContent = p._id?.slice(-8).toUpperCase() || '-';

  // Stock / Disponibilidad
  if (!p.disponibilidad || p.stock <= 0) {
    $('#addToCartBtn').disabled = true;
    $('#addToCartBtn').textContent = 'AGOTADO';
  }
}

// Renderizar galería
function renderGallery(images) {
  const mainImg = $('#mainImage');
  const thumbsContainer = $('#thumbnailsContainer');

  if (!images.length) {
    mainImg.src = 'https://placehold.co/600x700/f5f5f5/999?text=Sin+imagen';
    return;
  }

  // Imagen principal
  mainImg.src = `/uploads/imagenes/${images[0]}`;
  mainImg.alt = state.product?.nombre || 'Producto';

  // Thumbnails
  thumbsContainer.innerHTML = images.slice(0, 10).map((img, i) => `
    <button class="pdp-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
      <img src="/uploads/imagenes/${img}" alt="Vista ${i + 1}">
    </button>
  `).join('');

  // Event listeners para thumbnails
  $$('.pdp-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const index = parseInt(thumb.dataset.index);
      setActiveImage(index);
    });
  });

  // Navegación con flechas
  $('#prevImage').addEventListener('click', () => {
    const newIndex = state.currentImageIndex > 0 
      ? state.currentImageIndex - 1 
      : images.length - 1;
    setActiveImage(newIndex);
  });

  $('#nextImage').addEventListener('click', () => {
    const newIndex = state.currentImageIndex < images.length - 1 
      ? state.currentImageIndex + 1 
      : 0;
    setActiveImage(newIndex);
  });
}

function setActiveImage(index) {
  const images = state.product?.imagenes || [];
  if (!images[index]) return;

  state.currentImageIndex = index;
  $('#mainImage').src = `/uploads/imagenes/${images[index]}`;

  $$('.pdp-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
}

// Renderizar variantes
function renderVariants(variantes) {
  const section = $('#variantsSection');
  const grid = $('#variantsGrid');
  
  section.style.display = 'block';

  // Si no hay variantes, mostrar tallas por defecto
  if (!variantes || variantes.length === 0) {
    const tallasDefault = ['4', '6', '8', '10', '12', '14', '16'];
    
    $('.pdp-variants-label').innerHTML = `Talla: <span id="selectedVariant">Selecciona</span>`;
    
    grid.innerHTML = tallasDefault.map(talla => `
      <button class="pdp-variant-btn" 
              data-valor="${talla}"
              data-stock="10"
              data-precio-adicional="0">
        ${talla}
      </button>
    `).join('');
  } else {
    // Agrupar variantes por atributo (ej: "Talla", "Color")
    const grupos = {};
    variantes.forEach(v => {
      if (!grupos[v.atributo]) grupos[v.atributo] = [];
      grupos[v.atributo].push(v);
    });

    // Por ahora solo mostramos el primer grupo (normalmente tallas)
    const primerAtributo = Object.keys(grupos)[0];
    if (!primerAtributo) return;

    $('.pdp-variants-label').innerHTML = `${primerAtributo}: <span id="selectedVariant">Selecciona</span>`;

    grid.innerHTML = grupos[primerAtributo].map(v => `
      <button class="pdp-variant-btn ${v.stock <= 0 ? 'disabled' : ''}" 
              data-valor="${escapeHtml(v.valor)}"
              data-stock="${v.stock}"
              data-precio-adicional="${v.precioAdicional || 0}"
              ${v.stock <= 0 ? 'disabled' : ''}>
        ${escapeHtml(v.valor)}
      </button>
    `).join('');
  }

  // Event listeners
  $$('.pdp-variant-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.pdp-variant-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedVariant = btn.dataset.valor;
      $('#selectedVariant').textContent = btn.dataset.valor;

      // Actualizar precio si hay precio adicional
      const precioAdicional = parseFloat(btn.dataset.precioAdicional) || 0;
      if (precioAdicional > 0) {
        const nuevoPrecio = (state.product.precioBase || 0) + precioAdicional;
        $('#priceCurrent').textContent = formatPrice(nuevoPrecio);
      }
    });
  });
}

// Renderizar especificaciones
function renderSpecs(p) {
  const list = $('#specsList');
  const specs = [];

  if (p.categoria) specs.push(`<li><strong>Categoría:</strong> ${escapeHtml(p.categoria)}</li>`);
  if (p.stock) specs.push(`<li><strong>Stock disponible:</strong> ${p.stock} unidades</li>`);
  if (p.etiquetas?.length) specs.push(`<li><strong>Etiquetas:</strong> ${p.etiquetas.join(', ')}</li>`);
  if (p.seo?.slug) specs.push(`<li><strong>SKU:</strong> ${p.seo.slug}</li>`);

  list.innerHTML = specs.length ? specs.join('') : '<li>Sin especificaciones disponibles</li>';
}

// Cargar productos relacionados
async function loadRelatedProducts(product) {
  if (!product.relacionados?.length) return;

  try {
    const promises = product.relacionados.slice(0, 4).map(id => 
      API.get(`/api/products/${id}`).catch(() => null)
    );
    const responses = await Promise.all(promises);
    const products = responses
      .filter(r => r?.data)
      .map(r => r.data.product || r.data.data || r.data)
      .filter(p => p && p.nombre);

    if (products.length) {
      renderProductsSection('relatedSection', 'relatedProducts', products);
    }
  } catch (err) {
    console.error('Error cargando relacionados:', err);
  }
}

// Cargar productos de la misma categoría
async function loadDiscoverProducts(product) {
  if (!product.categoria) return;

  try {
    const res = await API.get(`/api/products/filter?categories=${encodeURIComponent(product.categoria)}&limit=8`);
    const data = res.data?.data?.products || res.data?.products || [];
    
    // Excluir el producto actual
    const products = data.filter(p => p._id !== product._id).slice(0, 4);
    
    if (products.length) {
      renderProductsSection('discoverSection', 'discoverProducts', products);
    }
  } catch (err) {
    console.error('Error cargando discover:', err);
  }
}

// Renderizar sección de productos
function renderProductsSection(sectionId, containerId, products) {
  const section = $(`#${sectionId}`);
  const container = $(`#${containerId}`);
  
  section.style.display = 'block';
  
  container.innerHTML = products.map(p => {
    const img = p.imagenes?.[0] 
      ? `/uploads/imagenes/${p.imagenes[0]}` 
      : 'https://placehold.co/300x400/f5f5f5/999?text=Sin+imagen';
    
    const precioOriginal = p.precioOriginal || p.precioBase * 1.3;
    const descuento = calcDiscount(precioOriginal, p.precioBase);

    return `
      <a href="/producto/${p._id}" class="pdp-product-card">
        ${descuento > 0 ? `<span class="pdp-product-card-badge">OFERTA</span>` : ''}
        <div class="pdp-product-card-image">
          <img src="${img}" alt="${escapeHtml(p.nombre)}" loading="lazy">
        </div>
        <div class="pdp-product-card-info">
          <p class="pdp-product-card-brand">${escapeHtml(p.marca || p.grupo || 'CMDESIGN')}</p>
          <h3 class="pdp-product-card-name">${escapeHtml(p.nombre)}</h3>
          <div class="pdp-product-card-prices">
            ${descuento > 0 ? `<span class="pdp-product-card-original">${formatPrice(precioOriginal)}</span>` : ''}
            <span class="pdp-product-card-current">${formatPrice(p.precioBase)}</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

// Mostrar error
function showError(message) {
  $('.pdp-container').innerHTML = `
    <div class="pdp-error" style="grid-column: 1 / -1;">
      <h2>Error</h2>
      <p>${message}</p>
      <a href="/catalogo" style="color: var(--pdp-primary);">Volver al catálogo</a>
    </div>
  `;
}

// Setup de event listeners
function setupEventListeners() {
  // Cantidad
  $('#qtyMinus')?.addEventListener('click', () => {
    if (state.quantity > 1) {
      state.quantity--;
      $('#qtyInput').value = state.quantity;
    }
  });

  $('#qtyPlus')?.addEventListener('click', () => {
    const maxStock = state.product?.stock || 10;
    if (state.quantity < Math.min(10, maxStock)) {
      state.quantity++;
      $('#qtyInput').value = state.quantity;
    }
  });

  // Agregar al carrito
  $('#addToCartBtn')?.addEventListener('click', async () => {
    const btn = $('#addToCartBtn');
    const originalText = btn.textContent;

    // Validar variante si es necesario
    if (state.product?.variantes?.length && !state.selectedVariant) {
      showToast('Selecciona una talla/variante', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'AGREGANDO...';

    try {
      const result = await CartManager.addToCart(state.product._id, state.quantity);
      
      if (result.success) {
        showToast('Producto agregado al carrito', 'success');
      } else {
        showToast(result.message || 'Error al agregar', 'error');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
    } finally {
      btn.disabled = !state.product?.disponibilidad;
      btn.textContent = state.product?.disponibilidad ? originalText : 'AGOTADO';
    }
  });

  // Wishlist (placeholder)
  $('#wishlistBtn')?.addEventListener('click', () => {
    const btn = $('#wishlistBtn');
    btn.classList.toggle('active');
    showToast(
      btn.classList.contains('active') ? 'Agregado a favoritos' : 'Eliminado de favoritos',
      'success'
    );
  });

  // Compartir WhatsApp
  $$('.pdp-share-btn')[1]?.addEventListener('click', () => {
    const url = window.location.href;
    const text = `Mira este producto: ${state.product?.nombre}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  });

  // Compartir Facebook
  $$('.pdp-share-btn')[0]?.addEventListener('click', () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadProduct();
  setupEventListeners();
});
