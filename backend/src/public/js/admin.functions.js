import { API } from './api.functions.js';
import authGuard from './authGuard.js';

// =============================================
// State Management
// =============================================
const state = {
    currentSection: 'dashboard',
    pagination: {
        products: { page: 1, pages: 1 },
        categories: { page: 1, pages: 1 },
        users: { page: 1, pages: 1 },
        sellers: { page: 1, pages: 1 },
        orders: { page: 1, pages: 1 },
        coupons: { page: 1, pages: 1 },
        shipping: { page: 1, pages: 1 }
    }
};

// Product Form Images State
let productFormImages = [];
let currentPreviewIndex = 0;
let newImageFiles = [];

// =============================================
// Product Form Preview Functions
// =============================================
function renderProductPreviewImages() {
    const mainImg = document.getElementById('previewMainImage');
    const thumbsContainer = document.getElementById('previewThumbnails');
    const badge = document.getElementById('previewBadge');
    
    if (!mainImg || !thumbsContainer) return;
    
    if (productFormImages.length === 0) {
        mainImg.src = 'https://placehold.co/600x700/2d2d2d/666?text=Subir+Imagen';
        thumbsContainer.innerHTML = `
            <div class="pdp-form-thumb pdp-form-thumb-add" id="addImageBtn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
            </div>
        `;
        initAddImageButton();
        return;
    }
    
    mainImg.src = productFormImages[currentPreviewIndex]?.url || '';
    
    let thumbsHtml = productFormImages.map((img, i) => `
        <div class="pdp-form-thumb ${i === currentPreviewIndex ? 'active' : ''}" data-index="${i}">
            <img src="${img.url}" alt="">
            <button type="button" class="pdp-form-thumb-remove" onclick="removeProductImage(this, '${img.name}')">x</button>
        </div>
    `).join('');
    
    thumbsHtml += `
        <div class="pdp-form-thumb pdp-form-thumb-add" id="addImageBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
        </div>
    `;
    
    thumbsContainer.innerHTML = thumbsHtml;
    
    thumbsContainer.querySelectorAll('.pdp-form-thumb[data-index]').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            if (e.target.closest('.pdp-form-thumb-remove')) return;
            currentPreviewIndex = parseInt(thumb.dataset.index);
            renderProductPreviewImages();
        });
    });
    
    initAddImageButton();
}

function initAddImageButton() {
    const addBtn = document.getElementById('addImageBtn');
    const fileInput = document.getElementById('productImages');
    if (addBtn && fileInput) {
        addBtn.onclick = () => fileInput.click();
    }
}

function initProductPreviewNavigation() {
    const prevBtn = document.getElementById('previewPrevBtn');
    const nextBtn = document.getElementById('previewNextBtn');
    
    prevBtn?.addEventListener('click', () => {
        if (productFormImages.length > 0) {
            currentPreviewIndex = (currentPreviewIndex - 1 + productFormImages.length) % productFormImages.length;
            renderProductPreviewImages();
        }
    });
    
    nextBtn?.addEventListener('click', () => {
        if (productFormImages.length > 0) {
            currentPreviewIndex = (currentPreviewIndex + 1) % productFormImages.length;
            renderProductPreviewImages();
        }
    });
}

function initProductPricePreview() {
    const originalPrice = document.getElementById('productOriginalPrice');
    const currentPrice = document.getElementById('productPrice');
    const discountBadge = document.getElementById('previewDiscountBadge');
    const discountPercent = document.getElementById('previewDiscountPercent');
    const previewBadge = document.getElementById('previewBadge');
    const previewDiscountText = document.getElementById('previewDiscountText');
    
    function updateDiscount() {
        const original = parseFloat(originalPrice?.value) || 0;
        const current = parseFloat(currentPrice?.value) || 0;
        
        if (original > current && current > 0) {
            const discount = Math.round(((original - current) / original) * 100);
            if (discountBadge) {
                discountBadge.style.display = 'block';
                discountPercent.textContent = `-${discount}%`;
            }
            if (previewBadge) {
                previewBadge.style.display = 'block';
                previewDiscountText.textContent = `-${discount}%`;
            }
        } else {
            if (discountBadge) discountBadge.style.display = 'none';
            if (previewBadge) previewBadge.style.display = 'none';
        }
    }
    
    originalPrice?.addEventListener('input', updateDiscount);
    currentPrice?.addEventListener('input', updateDiscount);
}

function initTechSheetPreview() {
    const techInput = document.getElementById('productTechSheet');
    const techLabel = document.querySelector('.pdp-form-tech-label');
    const techName = document.getElementById('techSheetName');
    
    techLabel?.addEventListener('click', () => techInput?.click());
    
    techInput?.addEventListener('change', () => {
        if (techInput.files[0]) {
            techName.textContent = techInput.files[0].name;
            techLabel.classList.add('has-file');
        } else {
            techName.textContent = 'Subir ficha tecnica (PDF)';
            techLabel.classList.remove('has-file');
        }
    });
}

function resetProductForm() {
    productFormImages = [];
    newImageFiles = [];
    currentPreviewIndex = 0;
    renderProductPreviewImages();
    
    const techLabel = document.querySelector('.pdp-form-tech-label');
    const techName = document.getElementById('techSheetName');
    if (techLabel) techLabel.classList.remove('has-file');
    if (techName) techName.textContent = 'Subir ficha tecnica (PDF)';
    
    const discountBadge = document.getElementById('previewDiscountBadge');
    const previewBadge = document.getElementById('previewBadge');
    if (discountBadge) discountBadge.style.display = 'none';
    if (previewBadge) previewBadge.style.display = 'none';
}

// =============================================
// Utility Functions
// =============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('adminToast');
    const icon = document.getElementById('toastIcon');
    const title = document.getElementById('toastTitle');
    const msg = document.getElementById('toastMessage');
    
    icon.className = type === 'success' 
        ? 'fas fa-check-circle text-success me-2'
        : type === 'error' 
            ? 'fas fa-times-circle text-danger me-2'
            : 'fas fa-info-circle text-info me-2';
    title.textContent = type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Info';
    msg.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusBadge(status) {
    const badges = {
        borrador: 'badge-muted',
        confirmado: 'badge-info',
        pagado: 'badge-success',
        en_preparacion: 'badge-warning',
        enviado: 'badge-info',
        entregado: 'badge-success',
        cancelado: 'badge-danger',
        reembolsado: 'badge-warning'
    };
    const labels = {
        borrador: 'Borrador',
        confirmado: 'Confirmado',
        pagado: 'Pagado',
        en_preparacion: 'En Preparación',
        enviado: 'Enviado',
        entregado: 'Entregado',
        cancelado: 'Cancelado',
        reembolsado: 'Reembolsado'
    };
    return `<span class="badge-status ${badges[status] || 'badge-muted'}">${labels[status] || status}</span>`;
}

function renderPagination(paginationData, loadFunctionName) {
    const { page, pages } = paginationData;
    if (pages <= 1) return '';
    
    let html = '<div class="pagination-admin">';
    html += `<button class="page-btn" ${page === 1 ? 'disabled' : ''} onclick="${loadFunctionName}(${page - 1})"><i class="fas fa-chevron-left"></i></button>`;
    
    for (let i = 1; i <= Math.min(pages, 5); i++) {
        const pageNum = pages <= 5 ? i : (page <= 3 ? i : (page >= pages - 2 ? pages - 5 + i : page - 3 + i));
        if (pageNum > 0 && pageNum <= pages) {
            html += `<button class="page-btn ${pageNum === page ? 'active' : ''}" onclick="${loadFunctionName}(${pageNum})">${pageNum}</button>`;
        }
    }
    
    html += `<button class="page-btn" ${page === pages ? 'disabled' : ''} onclick="${loadFunctionName}(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;
    html += '</div>';
    return html;
}

// =============================================
// Sidebar Navigation
// =============================================
function initSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggle = document.getElementById('sidebarToggle');
    const close = document.getElementById('sidebarClose');
    const links = document.querySelectorAll('.sidebar-link[data-section]');
    
    toggle?.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    });
    
    close?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);
    
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            navigateToSection(section);
            closeSidebar();
        });
    });
}

function navigateToSection(section) {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.sidebar-link[data-section="${section}"]`)?.classList.add('active');
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');
    
    const titles = {
        dashboard: 'Dashboard',
        products: 'Productos',
        categories: 'Categorías',
        users: 'Usuarios',
        sellers: 'Vendedores',
        orders: 'Pedidos',
        coupons: 'Cupones',
        shipping: 'Zonas de Envío',
        reports: 'Reportes'
    };
    document.getElementById('sectionTitle').textContent = titles[section] || section;
    
    state.currentSection = section;
    loadSectionData(section);
}

function loadSectionData(section) {
    switch(section) {
        case 'dashboard': loadDashboard(); break;
        case 'products': loadProducts(); break;
        case 'categories': loadCategories(); break;
        case 'users': loadUsers(); break;
        case 'sellers': loadSellers(); break;
        case 'orders': loadOrders(); break;
        case 'coupons': loadCoupons(); break;
        case 'shipping': loadShippingZones(); break;
        case 'reports': loadReports(); break;
    }
}

// =============================================
// Dashboard
// =============================================
async function loadDashboard() {
    const container = document.getElementById('section-dashboard');
    try {
        const res = await API.get('/api/admin/dashboard');
        if (res.data.success) {
            renderDashboard(res.data.data);
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error al cargar dashboard</h3></div>';
    }
}

function renderDashboard(data) {
    const { stats, usersByRole, recentProducts, recentUsers } = data;
    
    document.getElementById('section-dashboard').innerHTML = `
        <div class="stats-grid">
            <div class="stats-card">
                <div class="stats-card-icon primary"><i class="fas fa-users"></i></div>
                <div class="stats-number">${stats.totalUsers || 0}</div>
                <div class="stats-label">Usuarios</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon success"><i class="fas fa-box"></i></div>
                <div class="stats-number">${stats.totalProducts || 0}</div>
                <div class="stats-label">Productos</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon warning"><i class="fas fa-shopping-bag"></i></div>
                <div class="stats-number">${stats.totalOrders || 0}</div>
                <div class="stats-label">Pedidos</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon info"><i class="fas fa-dollar-sign"></i></div>
                <div class="stats-number">${formatCurrency(stats.totalRevenue || 0)}</div>
                <div class="stats-label">Ingresos</div>
            </div>
        </div>
        
        <div class="row g-4">
            <div class="col-lg-6">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3><i class="fas fa-chart-pie me-2"></i>Usuarios por Rol</h3>
                    </div>
                    <canvas id="rolesChart" height="200"></canvas>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3><i class="fas fa-clock me-2"></i>Usuarios Recientes</h3>
                    </div>
                    <div class="admin-table-wrapper" style="max-height: 250px; overflow-y: auto;">
                        <table class="admin-table">
                            <thead>
                                <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Fecha</th></tr>
                            </thead>
                            <tbody>
                                ${(recentUsers || []).map(u => `
                                    <tr>
                                        <td>${u.username}</td>
                                        <td>${u.email}</td>
                                        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
                                        <td>${formatDate(u.createdAt)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (usersByRole && usersByRole.length > 0) {
        const ctx = document.getElementById('rolesChart')?.getContext('2d');
        if (ctx) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: usersByRole.map(r => r._id),
                    datasets: [{
                        data: usersByRole.map(r => r.count),
                        backgroundColor: ['#e53935', '#fb8c00', '#43a047'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#9e9e9e' } }
                    }
                }
            });
        }
    }
}

// =============================================
// Products
// =============================================
let productCategoriesCache = {
    categoria: [],
    subcategoria: [],
    edad: [],
    genero: [],
    marca: [],
    personaje: [],
    coleccion: [],
    talla: []
};

async function loadProductCategories() {
    try {
        const res = await API.get('/api/categories/all');
        if (res.data.ok || res.data.success) {
            const cats = res.data.data || {};
            productCategoriesCache = {
                categoria: cats.categoria || [],
                subcategoria: cats.subcategoria || [],
                edad: cats.edad || [],
                genero: cats.genero || [],
                marca: cats.marca || [],
                personaje: cats.personaje || [],
                coleccion: cats.coleccion || [],
                talla: cats.talla || []
            };
        }
    } catch (err) {
        console.error('Error loading product categories');
    }
}

function populateProductCategorySelects(selectedValues = {}) {
    const selectMappings = {
        categoria: 'productCategory',
        coleccion: 'productCollection',
        edad: 'productAge',
        genero: 'productGender',
        marca: 'productBrand',
        personaje: 'productCharacter'
    };
    
    Object.entries(selectMappings).forEach(([type, selectId]) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const items = productCategoriesCache[type] || [];
        select.innerHTML = '<option value="">Seleccionar...</option>' +
            items.map(item => 
                `<option value="${item.nombre}" ${selectedValues[type] === item.nombre ? 'selected' : ''}>${item.nombre}</option>`
            ).join('');
    });
    
    // Subcategoria - depends on categoria
    updateProductSubcategorySelect(selectedValues.categoria, selectedValues.subcategoria);
    
    // Tallas grid
    renderTallasGrid(selectedValues.tallasDisponibles || []);
}

function updateProductSubcategorySelect(selectedCategoria, selectedSubcategoria = '') {
    const subcatSelect = document.getElementById('productSubcategory');
    if (!subcatSelect) return;
    
    if (!selectedCategoria) {
        subcatSelect.disabled = true;
        subcatSelect.innerHTML = '<option value="">Primero selecciona categoría</option>';
        return;
    }
    
    // Find categoria ID
    const categoria = productCategoriesCache.categoria.find(c => c.nombre === selectedCategoria);
    if (!categoria) {
        subcatSelect.disabled = true;
        subcatSelect.innerHTML = '<option value="">Sin subcategorías</option>';
        return;
    }
    
    // Filter subcategorias by parent
    const subcats = productCategoriesCache.subcategoria.filter(sub => {
        const padreId = typeof sub.padre === 'object' ? sub.padre._id : sub.padre;
        return padreId === categoria._id || String(padreId) === String(categoria._id);
    });
    
    if (subcats.length === 0) {
        subcatSelect.disabled = true;
        subcatSelect.innerHTML = '<option value="">Sin subcategorías</option>';
        return;
    }
    
    subcatSelect.disabled = false;
    subcatSelect.innerHTML = '<option value="">Seleccionar...</option>' +
        subcats.map(sub => 
            `<option value="${sub.nombre}" ${sub.nombre === selectedSubcategoria ? 'selected' : ''}>${sub.nombre}</option>`
        ).join('');
}

function renderTallasGrid(selectedTallas = []) {
    const grid = document.getElementById('productSizesGrid');
    if (!grid) return;
    
    const tallas = productCategoriesCache.talla || [];
    if (tallas.length === 0) {
        grid.innerHTML = '<p class="text-muted">No hay tallas configuradas</p>';
        return;
    }
    
    grid.innerHTML = tallas.map(t => `
        <button type="button" class="pdp-form-variant-btn ${selectedTallas.includes(t.nombre) ? 'active' : ''}" 
                data-talla="${t.nombre}" onclick="toggleTalla(this)">${t.nombre}</button>
    `).join('');
}

window.toggleTalla = function(btn) {
    btn.classList.toggle('active');
};

function getSelectedTallas() {
    const buttons = document.querySelectorAll('#productSizesGrid .pdp-form-variant-btn.active');
    return Array.from(buttons).map(btn => btn.dataset.talla);
}

async function loadProducts(page = 1) {
    const container = document.getElementById('productsContent');
    container.innerHTML = '<div class="section-loading"><div class="spinner-border" role="status"></div></div>';
    
    // Load categories for the product form
    await loadProductCategories();
    
    try {
        const res = await API.get(`/api/admin/products?page=${page}`);
        if (res.data.success) {
            state.pagination.products = res.data.data.pagination;
            renderProducts(res.data.data.products);
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error al cargar productos</h3></div>';
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsContent');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><h3>No hay productos</h3><p>Crea tu primer producto para comenzar</p></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => {
                        const imgSrc = p.imagenes?.[0] ? `/uploads/imagenes/${p.imagenes[0]}` : '/img/placeholder.jpg';
                        const stockLabel = p.stock === 0 && p.disponibilidad ? 'Bajo pedido' : (p.stock || 0);
                        return `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <img src="${imgSrc}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">
                                    <div>
                                        <div>${p.nombre}</div>
                                        <small class="text-muted">${p.subcategoria || ''}</small>
                                    </div>
                                </div>
                            </td>
                            <td>${p.categoria || '-'}</td>
                            <td>
                                <div>${formatCurrency(p.precioBase)}</div>
                                ${p.precioOriginal ? `<small class="text-muted text-decoration-line-through">${formatCurrency(p.precioOriginal)}</small>` : ''}
                            </td>
                            <td><span class="badge ${p.stock > 0 ? 'bg-success' : 'bg-warning'}">${stockLabel}</span></td>
                            <td>
                                <span class="badge-status ${p.disponibilidad ? 'badge-success' : 'badge-muted'}">
                                    ${p.disponibilidad ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td>
                                <div class="d-flex gap-1">
                                    <button class="btn-icon edit" onclick="editProduct('${p._id}')" title="Editar"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon ${p.disponibilidad ? 'delete' : 'view'}" onclick="toggleProduct('${p._id}')" title="${p.disponibilidad ? 'Desactivar' : 'Activar'}">
                                        <i class="fas ${p.disponibilidad ? 'fa-eye-slash' : 'fa-eye'}"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        ${renderPagination(state.pagination.products, 'loadProducts')}
    `;
}

window.editProduct = async function(id) {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    document.getElementById('productModalTitle').textContent = 'Editar Producto';
    document.getElementById('productId').value = id;
    
    try {
        const res = await API.get(`/api/products/${id}`);
        if (res.data.ok && res.data.data) {
            const p = res.data.data;
            
            // Basic info
            document.getElementById('productName').value = p.nombre || '';
            document.getElementById('productSku').value = p.sku || '';
            document.getElementById('productDescription').value = p.descripcion || '';
            
            // Prices and stock
            document.getElementById('productPrice').value = p.precioBase || 0;
            document.getElementById('productOriginalPrice').value = p.precioOriginal || '';
            document.getElementById('productStock').value = p.stock || 0;
            document.getElementById('productInventoryType').value = p.stock === 0 && p.disponibilidad ? 'pedido' : 'stock';
            document.getElementById('productAvailability').value = p.disponibilidad ? 'true' : 'false';
            
            // Populate category selects with selected values
            populateProductCategorySelects({
                categoria: p.categoria,
                subcategoria: p.subcategoria,
                coleccion: p.coleccion,
                edad: p.edad,
                genero: p.genero,
                marca: p.marca,
                personaje: p.personaje,
                tallasDisponibles: p.tallasDisponibles || []
            });
            
            // Tags
            document.getElementById('productTags').value = (p.etiquetas || []).join(', ');
            
            // Show existing images in PDP preview
            if (p.imagenes?.length) {
                productFormImages = p.imagenes.map(img => ({
                    url: `/uploads/imagenes/${img}`,
                    name: img,
                    isExisting: true
                }));
                currentPreviewIndex = 0;
                renderProductPreviewImages();
            }
        }
        modal.show();
    } catch (err) {
        showToast('Error al cargar producto', 'error');
    }
};

window.removeProductImage = function(btn, imageName) {
    productFormImages = productFormImages.filter(img => img.name !== imageName);
    if (currentPreviewIndex >= productFormImages.length) {
        currentPreviewIndex = Math.max(0, productFormImages.length - 1);
    }
    renderProductPreviewImages();
};

window.toggleProduct = async function(id) {
    try {
        const res = await API.patch(`/api/admin/products/${id}/availability`);
        if (res.data.success) {
            showToast(res.data.message || 'Estado actualizado');
            loadProducts(state.pagination.products.page);
        }
    } catch (err) {
        showToast('Error al cambiar estado', 'error');
    }
};

// =============================================
// Categories
// =============================================
// Cache for parent categories
let parentCategoriesCache = [];

async function loadCategories() {
    const container = document.getElementById('categoriesContent');
    container.innerHTML = '<div class="section-loading"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const res = await API.get('/api/categories/all');
        if (res.data.success || res.data.ok) {
            const categories = res.data.data || res.data.categories || [];
            parentCategoriesCache = categories.filter(c => c.tipo === 'categoria');
            renderCategories(categories);
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-tags"></i><h3>Error al cargar categorías</h3></div>';
    }
}

function renderCategories(categories) {
    const container = document.getElementById('categoriesContent');
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-tags"></i><h3>No hay categorías</h3><p>Crea tu primera categoría</p></div>';
        return;
    }
    
    const parentMap = {};
    categories.forEach(c => { if (c.tipo === 'categoria') parentMap[c._id] = c.nombre; });
    
    container.innerHTML = `
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr><th>Nombre</th><th>Tipo</th><th>Padre</th><th>Estado</th><th>Orden</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${categories.map(c => `
                        <tr>
                            <td>${c.nombre}</td>
                            <td><span class="badge bg-secondary">${c.tipo}</span></td>
                            <td>${c.padre ? (parentMap[c.padre] || parentMap[c.padre?._id] || c.padre?.nombre || '-') : '-'}</td>
                            <td><span class="badge-status ${c.activo !== false ? 'badge-success' : 'badge-muted'}">${c.activo !== false ? 'Activa' : 'Inactiva'}</span></td>
                            <td>${c.orden || 0}</td>
                            <td>
                                <div class="d-flex gap-1">
                                    <button class="btn-icon edit" onclick="editCategory('${c._id}')" title="Editar"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon delete" onclick="confirmDelete('${c._id}', 'category', '${c.nombre}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function updateParentCategorySelect(selectedParentId = '') {
    const select = document.getElementById('categoryParent');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar categoría padre...</option>' +
        parentCategoriesCache.map(c => 
            `<option value="${c._id}" ${c._id === selectedParentId ? 'selected' : ''}>${c.nombre}</option>`
        ).join('');
}

async function toggleParentSelect() {
    const tipo = document.getElementById('categoryType').value;
    const parentGroup = document.getElementById('categoryParentGroup');
    const parentSelect = document.getElementById('categoryParent');
    
    if (tipo === 'subcategoria') {
        parentGroup.style.display = 'block';
        parentSelect.required = true;
        
        // Load parent categories if cache is empty
        if (parentCategoriesCache.length === 0) {
            try {
                const res = await API.get('/api/categories/all');
                if (res.data.success || res.data.ok) {
                    const categories = res.data.data || res.data.categories || [];
                    parentCategoriesCache = categories.filter(c => c.tipo === 'categoria');
                }
            } catch (err) {
                console.error('Error loading parent categories');
            }
        }
        updateParentCategorySelect();
    } else {
        parentGroup.style.display = 'none';
        parentSelect.required = false;
        parentSelect.value = '';
    }
}

window.editCategory = async function(id) {
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
    document.getElementById('categoryId').value = id;
    
    try {
        const res = await API.get(`/api/admin/categories/${id}`);
        if (res.data.success || res.data.ok) {
            const c = res.data.data || res.data.category;
            document.getElementById('categoryName').value = c.nombre || '';
            document.getElementById('categoryType').value = c.tipo || 'categoria';
            document.getElementById('categoryDescription').value = c.descripcion || '';
            document.getElementById('categoryOrder').value = c.orden || 0;
            document.getElementById('categoryActive').checked = c.activo !== false;
            
            toggleParentSelect();
            if (c.tipo === 'subcategoria' && c.padre) {
                const parentId = typeof c.padre === 'object' ? c.padre._id : c.padre;
                updateParentCategorySelect(parentId);
            }
        }
        modal.show();
    } catch (err) {
        showToast('Error al cargar categoría', 'error');
    }
};

// =============================================
// Users
// =============================================
async function loadUsers(page = 1) {
    const container = document.getElementById('usersContent');
    container.innerHTML = '<div class="section-loading"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const res = await API.get(`/api/admin/users?page=${page}`);
        if (res.data.success) {
            state.pagination.users = res.data.data.pagination;
            renderUsers(res.data.data.users);
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>Error al cargar usuarios</h3></div>';
    }
}

function renderUsers(users) {
    const container = document.getElementById('usersContent');
    
    container.innerHTML = `
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Verificado</th><th>Registro</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td>${u.username}</td>
                            <td>${u.email}</td>
                            <td><span class="role-badge role-${u.role}">${u.role}</span></td>
                            <td><span class="badge-status ${u.verifiedEmail ? 'badge-success' : 'badge-warning'}">${u.verifiedEmail ? 'Sí' : 'No'}</span></td>
                            <td>${formatDate(u.createdAt)}</td>
                            <td>
                                <div class="d-flex gap-1">
                                    <button class="btn-icon edit" onclick="showRoleModal('${u._id}', '${u.username}', '${u.role}')" title="Cambiar rol"><i class="fas fa-user-edit"></i></button>
                                    <button class="btn-icon delete" onclick="confirmDelete('${u._id}', 'user', '${u.username}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ${renderPagination(state.pagination.users, 'loadUsers')}
    `;
}

window.showRoleModal = function(id, name, currentRole) {
    document.getElementById('roleUserId').value = id;
    document.getElementById('roleUserName').textContent = name;
    document.getElementById('roleSelect').value = currentRole;
    new bootstrap.Modal(document.getElementById('roleModal')).show();
};

// =============================================
// Sellers
// =============================================
async function loadSellers() {
    const container = document.getElementById('sellersContent');
    container.innerHTML = '<div class="section-loading"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const res = await API.get('/api/admin/sellers');
        if (res.data.success) {
            renderSellers(res.data.data.sellers || res.data.data || []);
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-user-tie"></i><h3>Error al cargar vendedores</h3></div>';
    }
}

function renderSellers(sellers) {
    const container = document.getElementById('sellersContent');
    
    if (!sellers || sellers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-user-tie"></i><h3>No hay vendedores</h3><p>Asigna el rol vendedor a un usuario</p></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr><th>Vendedor</th><th>Email</th><th>Comisión</th><th>Ventas</th><th>Pendiente</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${sellers.map(s => `
                        <tr>
                            <td>${s.username}</td>
                            <td>${s.email}</td>
                            <td>${s.informacionVendedor?.porcentajeComision || 5}%</td>
                            <td>${s.informacionVendedor?.ventasTotales || 0}</td>
                            <td>${formatCurrency(s.informacionVendedor?.comisionesPendientes || 0)}</td>
                            <td><span class="badge-status ${s.informacionVendedor?.activo !== false ? 'badge-success' : 'badge-muted'}">${s.informacionVendedor?.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                            <td>
                                <div class="d-flex gap-1">
                                    <button class="btn-icon edit" onclick="showCommissionModal('${s._id}', '${s.username}', ${s.informacionVendedor?.porcentajeComision || 5}, ${s.informacionVendedor?.metaMensual || 0})" title="Ajustar"><i class="fas fa-percent"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.showCommissionModal = function(id, name, commission, goal) {
    document.getElementById('commissionSellerId').value = id;
    document.getElementById('commissionSellerName').textContent = name;
    document.getElementById('commissionPercent').value = commission;
    document.getElementById('commissionGoal').value = goal;
    new bootstrap.Modal(document.getElementById('commissionModal')).show();
};

// =============================================
// Orders
// =============================================
async function loadOrders(page = 1) {
    const container = document.getElementById('ordersContent');
    container.innerHTML = '<div class="section-loading"><div class="spinner-border" role="status"></div></div>';
    
    const statusFilter = document.getElementById('orderStatusFilter')?.value || '';
    
    try {
        const res = await API.get(`/api/admin/orders?page=${page}${statusFilter ? `&status=${statusFilter}` : ''}`);
        if (res.data.success) {
            state.pagination.orders = res.data.data.pagination || { page: 1, pages: 1 };
            renderOrders(res.data.data.orders || []);
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>Error al cargar pedidos</h3></div>';
    }
}

function renderOrders(orders) {
    const container = document.getElementById('ordersContent');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No hay pedidos</h3></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${orders.map(o => `
                        <tr>
                            <td><strong>${o.numeroPedido || o._id.slice(-8)}</strong></td>
                            <td>${o.facturacion?.nombreCompleto || o.usuarioId?.username || 'Invitado'}</td>
                            <td>${formatCurrency(o.totales?.total || 0)}</td>
                            <td>${getStatusBadge(o.estado)}</td>
                            <td>${formatDate(o.fechaCreacion || o.createdAt)}</td>
                            <td>
                                <button class="btn-icon view" onclick="viewOrder('${o._id}')" title="Ver"><i class="fas fa-eye"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ${renderPagination(state.pagination.orders, 'loadOrders')}
    `;
}

window.viewOrder = async function(id) {
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    const content = document.getElementById('orderDetailContent');
    content.innerHTML = '<div class="section-loading"><div class="spinner-border" role="status"></div></div>';
    modal.show();
    
    try {
        const res = await API.get(`/api/admin/orders/${id}`);
        if (res.data.success) {
            const o = res.data.data;
            document.getElementById('orderNumber').textContent = o.numeroPedido || '';
            document.getElementById('orderStatusChange').dataset.orderId = id;
            content.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <h6>Cliente</h6>
                        <p class="mb-1">${o.facturacion?.nombreCompleto || '-'}</p>
                        <p class="mb-1 text-muted">${o.facturacion?.email || '-'}</p>
                        <p class="mb-0 text-muted">${o.facturacion?.telefono || '-'}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Envío</h6>
                        <p class="mb-1">${o.envio?.direccionEnvio?.calle || '-'}</p>
                        <p class="mb-0 text-muted">${o.envio?.direccionEnvio?.barrio || ''}, ${o.envio?.direccionEnvio?.ciudad || ''}</p>
                    </div>
                    <div class="col-12"><hr></div>
                    <div class="col-12">
                        <h6>Productos</h6>
                        <table class="admin-table">
                            <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
                            <tbody>
                                ${(o.items || []).map(i => `
                                    <tr>
                                        <td>${i.nombreProducto}</td>
                                        <td>${i.cantidad}</td>
                                        <td>${formatCurrency(i.precioUnitario)}</td>
                                        <td>${formatCurrency(i.subtotal)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="col-12"><hr></div>
                    <div class="col-md-6">
                        <p><strong>Estado:</strong> ${getStatusBadge(o.estado)}</p>
                    </div>
                    <div class="col-md-6 text-end">
                        <p><strong>Subtotal:</strong> ${formatCurrency(o.totales?.subtotal || 0)}</p>
                        <p><strong>Envío:</strong> ${formatCurrency(o.totales?.costoEnvio || 0)}</p>
                        <p class="fs-5"><strong>Total:</strong> ${formatCurrency(o.totales?.total || 0)}</p>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        content.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error</h3></div>';
    }
};

// =============================================
// Coupons
// =============================================
async function loadCoupons() {
    const container = document.getElementById('couponsContent');
    container.innerHTML = '<div class="section-loading"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const res = await API.get('/api/admin/coupons');
        if (res.data.success) {
            renderCoupons(res.data.data.coupons || res.data.data || []);
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-ticket-alt"></i><h3>Error al cargar cupones</h3></div>';
    }
}

function renderCoupons(coupons) {
    const container = document.getElementById('couponsContent');
    
    if (!coupons || coupons.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-ticket-alt"></i><h3>No hay cupones</h3><p>Crea tu primer cupón</p></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Valor</th><th>Usos</th><th>Vence</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${coupons.map(c => `
                        <tr>
                            <td><code>${c.codigo}</code></td>
                            <td>${c.nombre}</td>
                            <td>${c.tipo === 'porcentaje' ? '%' : '$'}</td>
                            <td>${c.tipo === 'porcentaje' ? c.valor + '%' : formatCurrency(c.valor)}</td>
                            <td>${c.estadisticas?.vecesUsado || 0}${c.condiciones?.maxUsos ? '/' + c.condiciones.maxUsos : ''}</td>
                            <td>${formatDate(c.fechaVencimiento)}</td>
                            <td><span class="badge-status ${c.activo ? 'badge-success' : 'badge-muted'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
                            <td>
                                <div class="d-flex gap-1">
                                    <button class="btn-icon edit" onclick="editCoupon('${c._id}')" title="Editar"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon delete" onclick="confirmDelete('${c._id}', 'coupon', '${c.codigo}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.editCoupon = async function(id) {
    const modal = new bootstrap.Modal(document.getElementById('couponModal'));
    document.getElementById('couponModalTitle').textContent = 'Editar Cupón';
    document.getElementById('couponId').value = id;
    
    try {
        const res = await API.get(`/api/admin/coupons/${id}`);
        if (res.data.success) {
            const c = res.data.data;
            document.getElementById('couponCode').value = c.codigo || '';
            document.getElementById('couponName').value = c.nombre || '';
            document.getElementById('couponDescription').value = c.descripcion || '';
            document.getElementById('couponType').value = c.tipo || 'porcentaje';
            document.getElementById('couponValue').value = c.valor || 0;
            document.getElementById('couponMaxDiscount').value = c.descuentoMaximo || '';
            document.getElementById('couponMinAmount').value = c.condiciones?.montoMinimo || 0;
            document.getElementById('couponMaxUses').value = c.condiciones?.maxUsos || '';
            document.getElementById('couponMaxUsesPerUser').value = c.condiciones?.maxUsosPorUsuario || 1;
            document.getElementById('couponStartDate').value = c.fechaInicio?.slice(0, 16) || '';
            document.getElementById('couponEndDate').value = c.fechaVencimiento?.slice(0, 16) || '';
            document.getElementById('couponActive').checked = c.activo !== false;
        }
        modal.show();
    } catch (err) {
        showToast('Error al cargar cupón', 'error');
    }
};

// =============================================
// Shipping Zones
// =============================================
async function loadShippingZones() {
    const container = document.getElementById('shippingContent');
    container.innerHTML = '<div class="section-loading"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const res = await API.get('/api/admin/shipping-zones');
        if (res.data.success) {
            renderShippingZones(res.data.data.zones || res.data.data || []);
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-truck"></i><h3>Error al cargar zonas</h3></div>';
    }
}

function renderShippingZones(zones) {
    const container = document.getElementById('shippingContent');
    
    if (!zones || zones.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-truck"></i><h3>No hay zonas</h3><p>Configura tu primera zona de envío</p></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr><th>Nombre</th><th>Código</th><th>Tarifa</th><th>Tiempo</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${zones.map(z => `
                        <tr>
                            <td>${z.nombre}</td>
                            <td><code>${z.codigo}</code></td>
                            <td>${formatCurrency(z.tarifaBase)}</td>
                            <td>${z.tiempoEntregaMin || 1}-${z.tiempoEntregaMax || 3} días</td>
                            <td><span class="badge-status ${z.activa ? 'badge-success' : 'badge-muted'}">${z.activa ? 'Activa' : 'Inactiva'}</span></td>
                            <td>
                                <div class="d-flex gap-1">
                                    <button class="btn-icon edit" onclick="editShippingZone('${z._id}')" title="Editar"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon delete" onclick="confirmDelete('${z._id}', 'shipping', '${z.nombre}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.editShippingZone = async function(id) {
    const modal = new bootstrap.Modal(document.getElementById('shippingModal'));
    document.getElementById('shippingModalTitle').textContent = 'Editar Zona';
    document.getElementById('shippingId').value = id;
    
    try {
        const res = await API.get(`/api/admin/shipping-zones/${id}`);
        if (res.data.success) {
            const z = res.data.data;
            document.getElementById('shippingName').value = z.nombre || '';
            document.getElementById('shippingCode').value = z.codigo || '';
            document.getElementById('shippingDescription').value = z.descripcion || '';
            document.getElementById('shippingBaseRate').value = z.tarifaBase || 0;
            document.getElementById('shippingKgRate').value = z.tarifaPorKg || 0;
            document.getElementById('shippingDeliveryTime').value = `${z.tiempoEntregaMin || 1}-${z.tiempoEntregaMax || 3}`;
            document.getElementById('shippingBarrios').value = (z.barrios || []).join(', ');
            document.getElementById('shippingFreeFrom').value = z.envioGratisPor?.montoMinimo || '';
            document.getElementById('shippingActive').checked = z.activa !== false;
        }
        modal.show();
    } catch (err) {
        showToast('Error al cargar zona', 'error');
    }
};

// =============================================
// Reports
// =============================================
async function loadReports() {
    const container = document.getElementById('reportsContent');
    container.innerHTML = '<div class="section-loading"><div class="spinner-border" role="status"></div></div>';
    
    const dateFrom = document.getElementById('reportDateFrom')?.value;
    const dateTo = document.getElementById('reportDateTo')?.value;
    
    try {
        const res = await API.get(`/api/admin/reports?from=${dateFrom || ''}&to=${dateTo || ''}`);
        if (res.data.success) {
            renderReports(res.data.data);
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><h3>Error al cargar reportes</h3></div>';
    }
}

function renderReports(data) {
    const container = document.getElementById('reportsContent');
    
    container.innerHTML = `
        <div class="stats-grid mb-4">
            <div class="stats-card">
                <div class="stats-card-icon success"><i class="fas fa-shopping-cart"></i></div>
                <div class="stats-number">${data.totalOrders || 0}</div>
                <div class="stats-label">Pedidos</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon primary"><i class="fas fa-dollar-sign"></i></div>
                <div class="stats-number">${formatCurrency(data.totalRevenue || 0)}</div>
                <div class="stats-label">Ingresos</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon warning"><i class="fas fa-chart-line"></i></div>
                <div class="stats-number">${formatCurrency(data.averageOrder || 0)}</div>
                <div class="stats-label">Ticket Promedio</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon info"><i class="fas fa-percent"></i></div>
                <div class="stats-number">${formatCurrency(data.totalCommissions || 0)}</div>
                <div class="stats-label">Comisiones</div>
            </div>
        </div>
        
        <div class="row g-4">
            <div class="col-lg-6">
                <div class="chart-container">
                    <div class="chart-header"><h3><i class="fas fa-star me-2"></i>Top Productos</h3></div>
                    ${(data.topProducts || []).length > 0 ? `
                        <table class="admin-table">
                            <thead><tr><th>Producto</th><th>Ventas</th><th>Ingresos</th></tr></thead>
                            <tbody>
                                ${(data.topProducts || []).map(p => `
                                    <tr><td>${p.nombre}</td><td>${p.cantidad}</td><td>${formatCurrency(p.ingresos)}</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p class="text-muted text-center py-3">Sin datos</p>'}
                </div>
            </div>
            <div class="col-lg-6">
                <div class="chart-container">
                    <div class="chart-header"><h3><i class="fas fa-user-tie me-2"></i>Comisiones Vendedores</h3></div>
                    ${(data.sellerCommissions || []).length > 0 ? `
                        <table class="admin-table">
                            <thead><tr><th>Vendedor</th><th>Ventas</th><th>Comisión</th></tr></thead>
                            <tbody>
                                ${(data.sellerCommissions || []).map(s => `
                                    <tr><td>${s.username}</td><td>${s.ventas}</td><td>${formatCurrency(s.comision)}</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p class="text-muted text-center py-3">Sin datos</p>'}
                </div>
            </div>
        </div>
    `;
}

// =============================================
// Delete Confirmation
// =============================================
window.confirmDelete = function(id, type, name) {
    document.getElementById('deleteItemId').value = id;
    document.getElementById('deleteItemType').value = type;
    document.getElementById('deleteMessage').innerHTML = `¿Eliminar <strong>${name}</strong>?`;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
};

// =============================================
// Form Submissions
// =============================================
function initForms() {
    // Product Form
    document.getElementById('productForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('productId').value;
        const formData = new FormData();
        
        // Basic info
        formData.append('nombre', document.getElementById('productName').value);
        const sku = document.getElementById('productSku').value;
        if (sku) formData.append('sku', sku);
        formData.append('descripcion', document.getElementById('productDescription').value);
        
        // Prices and stock
        formData.append('precioBase', document.getElementById('productPrice').value);
        const originalPrice = document.getElementById('productOriginalPrice').value;
        if (originalPrice) formData.append('precioOriginal', originalPrice);
        
        const inventoryType = document.getElementById('productInventoryType').value;
        const stock = inventoryType === 'pedido' ? 0 : document.getElementById('productStock').value;
        formData.append('stock', stock);
        formData.append('disponibilidad', document.getElementById('productAvailability').value);
        
        // Categories
        const categoria = document.getElementById('productCategory').value;
        if (categoria) formData.append('categoria', categoria);
        
        const subcategoria = document.getElementById('productSubcategory').value;
        if (subcategoria) formData.append('subcategoria', subcategoria);
        
        const coleccion = document.getElementById('productCollection').value;
        if (coleccion) formData.append('coleccion', coleccion);
        
        const edad = document.getElementById('productAge').value;
        if (edad) formData.append('edad', edad);
        
        const genero = document.getElementById('productGender').value;
        if (genero) formData.append('genero', genero);
        
        const marca = document.getElementById('productBrand').value;
        if (marca) formData.append('marca', marca);
        
        const personaje = document.getElementById('productCharacter').value;
        if (personaje) formData.append('personaje', personaje);
        
        // Tallas
        const tallas = getSelectedTallas();
        if (tallas.length) formData.append('tallasDisponibles', JSON.stringify(tallas));
        
        // Tags
        formData.append('etiquetas', document.getElementById('productTags').value);
        
        // Files - New images from file input
        for (let i = 0; i < newImageFiles.length; i++) {
            formData.append('imagenes', newImageFiles[i]);
        }
        
        const techSheet = document.getElementById('productTechSheet').files[0];
        if (techSheet) formData.append('fichaTecnica', techSheet);
        
        // Keep existing images if editing
        if (id) {
            const existingImages = productFormImages
                .filter(img => img.isExisting)
                .map(img => img.name);
            if (existingImages.length) formData.append('imagenesExistentes', JSON.stringify(existingImages));
        }
        
        try {
            const url = id ? `/api/products/edit/${id}` : '/api/products';
            const method = id ? 'put' : 'post';
            const res = await API[method](url, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            
            if (res.data.ok || res.data.success) {
                showToast(id ? 'Producto actualizado' : 'Producto creado');
                bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
                loadProducts();
            } else {
                showToast(res.data.message || 'Error', 'error');
            }
        } catch (err) {
            showToast('Error al guardar', 'error');
        }
    });
    
    // Product Category Change - update subcategory
    document.getElementById('productCategory')?.addEventListener('change', (e) => {
        updateProductSubcategorySelect(e.target.value);
    });
    
    // Product Inventory Type Change
    document.getElementById('productInventoryType')?.addEventListener('change', (e) => {
        const stockInput = document.getElementById('productStock');
        if (e.target.value === 'pedido') {
            stockInput.value = 0;
            stockInput.disabled = true;
        } else {
            stockInput.disabled = false;
        }
    });
    
    // Category Form
    document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('categoryId').value;
        const tipo = document.getElementById('categoryType').value;
        const data = {
            nombre: document.getElementById('categoryName').value,
            tipo: tipo,
            descripcion: document.getElementById('categoryDescription').value,
            orden: parseInt(document.getElementById('categoryOrder').value) || 0,
            activo: document.getElementById('categoryActive').checked
        };
        
        if (tipo === 'subcategoria') {
            const padre = document.getElementById('categoryParent').value;
            if (!padre) {
                showToast('Selecciona una categoría padre', 'error');
                return;
            }
            data.padre = padre;
        } else {
            data.padre = null;
        }
        
        try {
            const url = id ? `/api/admin/categories/${id}` : '/api/admin/categories';
            const method = id ? 'put' : 'post';
            const res = await API[method](url, data);
            
            if (res.data.ok || res.data.success) {
                showToast(id ? 'Categoría actualizada' : 'Categoría creada');
                bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
                loadCategories();
            }
        } catch (err) {
            showToast('Error al guardar', 'error');
        }
    });
    
    // Coupon Form
    document.getElementById('couponForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('couponId').value;
        const data = {
            codigo: document.getElementById('couponCode').value.toUpperCase(),
            nombre: document.getElementById('couponName').value,
            descripcion: document.getElementById('couponDescription').value,
            tipo: document.getElementById('couponType').value,
            valor: parseFloat(document.getElementById('couponValue').value),
            descuentoMaximo: parseFloat(document.getElementById('couponMaxDiscount').value) || null,
            condiciones: {
                montoMinimo: parseFloat(document.getElementById('couponMinAmount').value) || 0,
                maxUsos: parseInt(document.getElementById('couponMaxUses').value) || null,
                maxUsosPorUsuario: parseInt(document.getElementById('couponMaxUsesPerUser').value) || 1
            },
            fechaInicio: document.getElementById('couponStartDate').value,
            fechaVencimiento: document.getElementById('couponEndDate').value,
            activo: document.getElementById('couponActive').checked
        };
        
        try {
            const url = id ? `/api/admin/coupons/${id}` : '/api/admin/coupons';
            const method = id ? 'put' : 'post';
            const res = await API[method](url, data);
            
            if (res.data.ok || res.data.success) {
                showToast(id ? 'Cupón actualizado' : 'Cupón creado');
                bootstrap.Modal.getInstance(document.getElementById('couponModal')).hide();
                loadCoupons();
            }
        } catch (err) {
            showToast('Error al guardar', 'error');
        }
    });
    
    // Shipping Form
    document.getElementById('shippingForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('shippingId').value;
        const deliveryTime = document.getElementById('shippingDeliveryTime').value.split('-');
        const data = {
            nombre: document.getElementById('shippingName').value,
            codigo: document.getElementById('shippingCode').value.toUpperCase(),
            descripcion: document.getElementById('shippingDescription').value,
            tarifaBase: parseFloat(document.getElementById('shippingBaseRate').value),
            tarifaPorKg: parseFloat(document.getElementById('shippingKgRate').value) || 0,
            tiempoEntregaMin: parseInt(deliveryTime[0]) || 1,
            tiempoEntregaMax: parseInt(deliveryTime[1]) || 3,
            barrios: document.getElementById('shippingBarrios').value.split(',').map(b => b.trim()).filter(Boolean),
            envioGratisPor: { montoMinimo: parseFloat(document.getElementById('shippingFreeFrom').value) || null },
            activa: document.getElementById('shippingActive').checked
        };
        
        try {
            const url = id ? `/api/admin/shipping-zones/${id}` : '/api/admin/shipping-zones';
            const method = id ? 'put' : 'post';
            const res = await API[method](url, data);
            
            if (res.data.ok || res.data.success) {
                showToast(id ? 'Zona actualizada' : 'Zona creada');
                bootstrap.Modal.getInstance(document.getElementById('shippingModal')).hide();
                loadShippingZones();
            }
        } catch (err) {
            showToast('Error al guardar', 'error');
        }
    });
    
    // Role Change
    document.getElementById('btnConfirmRole')?.addEventListener('click', async () => {
        const id = document.getElementById('roleUserId').value;
        const role = document.getElementById('roleSelect').value;
        
        try {
            const res = await API.put(`/api/admin/users/${id}/role`, { role });
            if (res.data.success) {
                showToast('Rol actualizado');
                bootstrap.Modal.getInstance(document.getElementById('roleModal')).hide();
                loadUsers();
                loadDashboard();
            }
        } catch (err) {
            showToast('Error al cambiar rol', 'error');
        }
    });
    
    // Commission Save
    document.getElementById('btnSaveCommission')?.addEventListener('click', async () => {
        const id = document.getElementById('commissionSellerId').value;
        const data = {
            porcentajeComision: parseFloat(document.getElementById('commissionPercent').value),
            metaMensual: parseFloat(document.getElementById('commissionGoal').value) || 0
        };
        
        try {
            const res = await API.put(`/api/admin/sellers/${id}/commission`, data);
            if (res.data.success) {
                showToast('Comisión actualizada');
                bootstrap.Modal.getInstance(document.getElementById('commissionModal')).hide();
                loadSellers();
            }
        } catch (err) {
            showToast('Error al guardar', 'error');
        }
    });
    
    // Delete Confirm
    document.getElementById('btnConfirmDelete')?.addEventListener('click', async () => {
        const id = document.getElementById('deleteItemId').value;
        const type = document.getElementById('deleteItemType').value;
        
        const endpoints = {
            product: `/api/products/${id}`,
            category: `/api/admin/categories/${id}`,
            user: `/api/admin/users/${id}`,
            coupon: `/api/admin/coupons/${id}`,
            shipping: `/api/admin/shipping-zones/${id}`
        };
        
        try {
            const res = await API.delete(endpoints[type]);
            if (res.data.success || res.data.ok) {
                showToast('Eliminado');
                bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
                loadSectionData(state.currentSection);
            }
        } catch (err) {
            showToast('Error al eliminar', 'error');
        }
    });
    
    // Category Type Change - toggle parent select
    document.getElementById('categoryType')?.addEventListener('change', toggleParentSelect);
    
    // Order Status Change
    document.getElementById('orderStatusChange')?.addEventListener('change', async (e) => {
        const status = e.target.value;
        const orderId = e.target.dataset.orderId;
        if (!status || !orderId) return;
        
        try {
            const res = await API.patch(`/api/admin/orders/${orderId}/status`, { estado: status });
            if (res.data.success) {
                showToast('Estado actualizado');
                bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
                loadOrders();
            }
        } catch (err) {
            showToast('Error al cambiar estado', 'error');
        }
    });
    
    // Order Filter
    document.getElementById('orderStatusFilter')?.addEventListener('change', () => loadOrders(1));
    
    // Report Generate
    document.getElementById('btnGenerateReport')?.addEventListener('click', () => loadReports());
    
    // Product Images Input
    document.getElementById('productImages')?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const url = URL.createObjectURL(file);
            productFormImages.push({
                url,
                name: file.name,
                isExisting: false,
                file
            });
            newImageFiles.push(file);
        });
        currentPreviewIndex = productFormImages.length - 1;
        renderProductPreviewImages();
        e.target.value = '';
    });
    
    // Init product preview navigation and price calculator
    initProductPreviewNavigation();
    initProductPricePreview();
    initTechSheetPreview();
    
    // Reset modals on close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('hidden.bs.modal', () => {
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
                const hiddenId = form.querySelector('input[type="hidden"]');
                if (hiddenId) hiddenId.value = '';
            }
            // Reset category parent group
            if (modal.id === 'categoryModal') {
                document.getElementById('categoryParentGroup').style.display = 'none';
            }
            // Reset product form extras
            if (modal.id === 'productModal') {
                resetProductForm();
                document.getElementById('productStock').disabled = false;
            }
        });
    });
    
    // Reset category modal on open for new category
    document.getElementById('categoryModal')?.addEventListener('show.bs.modal', (e) => {
        // Only reset if opening for new category (not edit)
        const categoryId = document.getElementById('categoryId').value;
        if (!categoryId) {
            document.getElementById('categoryModalTitle').textContent = 'Nueva Categoria';
            document.getElementById('categoryParentGroup').style.display = 'none';
            document.getElementById('categoryParent').value = '';
        }
    });
    
    // Reset product modal on open for new product
    document.getElementById('productModal')?.addEventListener('show.bs.modal', async (e) => {
        const productId = document.getElementById('productId').value;
        if (!productId) {
            document.getElementById('productModalTitle').textContent = 'Nuevo Producto';
            resetProductForm();
            await loadProductCategories();
            populateProductCategorySelects();
        }
    });
}

// =============================================
// Logout
// =============================================
async function logout() {
    try { await API.get('/api/auth/logout'); } catch (err) {}
    window.location.replace('/login');
}

// =============================================
// Admin Info
// =============================================
async function loadAdminInfo() {
    try {
        const res = await API.get('/api/auth/profile');
        if (res.data.success) {
            document.getElementById('adminEmail').textContent = res.data.user.email;
        }
    } catch (err) {}
}

// =============================================
// Initialize
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    authGuard('/login');
    initSidebar();
    initForms();
    loadAdminInfo();
    loadDashboard();
    
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

// Export for global access
window.loadProducts = loadProducts;
window.loadCategories = loadCategories;
window.loadUsers = loadUsers;
window.loadSellers = loadSellers;
window.loadOrders = loadOrders;
window.loadCoupons = loadCoupons;
window.loadShippingZones = loadShippingZones;
window.loadReports = loadReports;
