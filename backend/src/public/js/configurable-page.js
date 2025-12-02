import { API } from './api.functions.js';

const PAGE_SLUG = document.querySelector('.cm-configurable-page')?.dataset.slug || 'hoodies';

let isAdmin = false;
let isEditMode = false;
let pageConfig = null;

async function checkAdminStatus() {
    try {
        const res = await API.get('/auth/me');
        if (res?.data?.ok && res.data.user?.role === 'admin') {
            isAdmin = true;
            document.getElementById('adminEditControls').style.display = 'flex';
        }
    } catch {
        try {
            const res = await API.get('/api/auth/profile');
            if (res?.data?.success && res.data.user?.role === 'admin') {
                isAdmin = true;
                document.getElementById('adminEditControls').style.display = 'flex';
            }
        } catch {}
    }
}

async function loadPageConfig() {
    try {
        const res = await API.get(`/api/page-config/${PAGE_SLUG}`);
        if (res.data.success) {
            pageConfig = res.data.data;
            renderPage();
        }
    } catch (err) {
        console.error('Error loading page config:', err);
        document.getElementById('cardsGrid').innerHTML = `
            <div class="cm-empty-state">
                <p>Error al cargar la configuración</p>
            </div>
        `;
    }
}

function renderPage() {
    if (!pageConfig) return;
    
    document.getElementById('pageTitle').textContent = pageConfig.titulo || 'Sin título';
    document.getElementById('pageDescription').textContent = pageConfig.descripcion || '';
    
    renderCards();
}

function renderCards() {
    const grid = document.getElementById('cardsGrid');
    const cards = (pageConfig?.cards || []).filter(c => c.activo || isEditMode).sort((a, b) => a.orden - b.orden);
    
    // Set data-count para grid responsivo centrado
    const count = Math.min(cards.length, 4);
    grid.setAttribute('data-count', count || 1);
    
    if (cards.length === 0) {
        grid.innerHTML = `
            <div class="cm-empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                </svg>
                <p>${isEditMode ? 'No hay cards configuradas. Añade la primera.' : 'Próximamente...'}</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = cards.map(card => renderCard(card)).join('');
    
    if (isEditMode) {
        grid.querySelectorAll('.cm-dynamic-card').forEach(cardEl => {
            cardEl.addEventListener('click', () => openEditModal(cardEl.dataset.id));
        });
    }
}

function renderCard(card) {
    const hasImage = card.imagen && card.imagen.trim();
    const style = `
        background: ${hasImage ? `linear-gradient(to top, rgba(0,0,0,0.7), transparent), url('${card.imagen}') center/cover` : card.colorFondo};
        ${!hasImage ? `background-color: ${card.colorFondo};` : ''}
    `;
    
    const editOverlay = isEditMode ? `
        <div class="cm-card-edit-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            <span>Editar</span>
        </div>
    ` : '';
    
    const inactiveLabel = !card.activo && isEditMode ? '<span class="cm-card-inactive-label">Inactiva</span>' : '';
    
    return `
        <a href="/catalogo?${card.filtros}" 
           class="cm-dynamic-card ${isEditMode ? 'cm-edit-mode' : ''} ${!card.activo ? 'cm-card-inactive' : ''}"
           data-id="${card._id}"
           style="${style}"
           ${isEditMode ? 'onclick="event.preventDefault()"' : ''}>
            ${editOverlay}
            ${inactiveLabel}
            <div class="cm-card-overlay"></div>
            <div class="cm-card-content" style="color: ${card.colorTexto}">
                <h2 class="cm-card-title">${card.titulo}</h2>
                ${card.subtitulo ? `<p class="cm-card-subtitle">${card.subtitulo}</p>` : ''}
                <span class="cm-card-cta" style="background: ${card.colorBoton}; color: ${card.colorBotonTexto}">
                    ${card.textoBoton || 'Ver colección'}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </span>
            </div>
        </a>
    `;
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const btn = document.getElementById('btnToggleEdit');
    const addContainer = document.getElementById('addCardContainer');
    
    if (isEditMode) {
        btn.classList.add('active');
        btn.querySelector('span').textContent = 'Salir de Edición';
        addContainer.style.display = 'flex';
    } else {
        btn.classList.remove('active');
        btn.querySelector('span').textContent = 'Modo Edición';
        addContainer.style.display = 'none';
    }
    
    renderCards();
}

function openEditModal(cardId = null) {
    const modal = new bootstrap.Modal(document.getElementById('cardModal'));
    const form = document.getElementById('cardForm');
    const deleteBtn = document.getElementById('btnDeleteCard');
    
    form.reset();
    document.getElementById('cardId').value = '';
    resetImagePreview();
    
    if (cardId) {
        const card = pageConfig.cards.find(c => c._id === cardId);
        if (card) {
            document.getElementById('cardModalTitle').textContent = 'Editar Card';
            document.getElementById('cardId').value = card._id;
            document.getElementById('cardTitulo').value = card.titulo || '';
            document.getElementById('cardSubtitulo').value = card.subtitulo || '';
            document.getElementById('cardImagen').value = card.imagen || '';
            document.getElementById('cardTextoBoton').value = card.textoBoton || 'Ver colección';
            document.getElementById('cardFiltros').value = card.filtros || '';
            document.getElementById('cardColorFondo').value = card.colorFondo || '#1a1a1a';
            document.getElementById('cardColorFondoText').value = card.colorFondo || '#1a1a1a';
            document.getElementById('cardColorTexto').value = card.colorTexto || '#ffffff';
            document.getElementById('cardColorTextoText').value = card.colorTexto || '#ffffff';
            document.getElementById('cardColorBoton').value = card.colorBoton || '#ffffff';
            document.getElementById('cardColorBotonText').value = card.colorBoton || '#ffffff';
            document.getElementById('cardColorBotonTexto').value = card.colorBotonTexto || '#1a1a1a';
            document.getElementById('cardColorBotonTextoText').value = card.colorBotonTexto || '#1a1a1a';
            document.getElementById('cardOrden').value = card.orden || 0;
            document.getElementById('cardActivo').checked = card.activo !== false;
            deleteBtn.style.display = 'inline-block';
            
            if (card.imagen) {
                updateImagePreview(card.imagen);
            }
        }
    } else {
        document.getElementById('cardModalTitle').textContent = 'Nueva Card';
        document.getElementById('cardColorFondo').value = '#1a1a1a';
        document.getElementById('cardColorFondoText').value = '#1a1a1a';
        document.getElementById('cardColorTexto').value = '#ffffff';
        document.getElementById('cardColorTextoText').value = '#ffffff';
        document.getElementById('cardColorBoton').value = '#ffffff';
        document.getElementById('cardColorBotonText').value = '#ffffff';
        document.getElementById('cardColorBotonTexto').value = '#1a1a1a';
        document.getElementById('cardColorBotonTextoText').value = '#1a1a1a';
        deleteBtn.style.display = 'none';
    }
    
    updatePreview();
    modal.show();
}

function resetImagePreview() {
    const thumb = document.getElementById('imagePreviewThumb');
    const placeholder = document.getElementById('imagePlaceholder');
    const removeBtn = document.getElementById('btnRemoveImage');
    
    if (thumb) thumb.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
}

function updateImagePreview(imageUrl) {
    const thumb = document.getElementById('imagePreviewThumb');
    const placeholder = document.getElementById('imagePlaceholder');
    const removeBtn = document.getElementById('btnRemoveImage');
    
    if (imageUrl) {
        thumb.src = imageUrl;
        thumb.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'block';
    } else {
        resetImagePreview();
    }
}

async function uploadImage(file) {
    const progress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    
    progress.style.display = 'block';
    progressBar.style.width = '0%';
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        progressBar.style.width = '50%';
        
        const res = await fetch(`/api/page-config/${PAGE_SLUG}/upload-image`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        progressBar.style.width = '100%';
        
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('cardImagen').value = data.data.url;
            updateImagePreview(data.data.url);
            updatePreview();
            showToast('Imagen subida');
        } else {
            showToast(data.message || 'Error al subir imagen', 'error');
        }
    } catch (err) {
        console.error('Error uploading image:', err);
        showToast('Error al subir imagen', 'error');
    } finally {
        setTimeout(() => {
            progress.style.display = 'none';
            progressBar.style.width = '0%';
        }, 500);
    }
}

function removeImage() {
    document.getElementById('cardImagen').value = '';
    document.getElementById('cardImagenFile').value = '';
    resetImagePreview();
    updatePreview();
}

function updatePreview() {
    const preview = document.getElementById('cardPreview');
    const titulo = document.getElementById('cardTitulo').value || 'Título';
    const colorFondo = document.getElementById('cardColorFondo').value;
    const colorTexto = document.getElementById('cardColorTexto').value;
    const colorBoton = document.getElementById('cardColorBoton').value;
    const colorBotonTexto = document.getElementById('cardColorBotonTexto').value;
    const textoBoton = document.getElementById('cardTextoBoton').value || 'Ver colección';
    const imagen = document.getElementById('cardImagen').value;
    
    if (imagen) {
        preview.style.background = `linear-gradient(to top, rgba(0,0,0,0.7), transparent), url('${imagen}') center/cover`;
    } else {
        preview.style.background = colorFondo;
    }
    
    preview.innerHTML = `
        <div class="cm-card-preview-content" style="color: ${colorTexto}">
            <h3>${titulo}</h3>
            <span class="cm-card-preview-btn" style="background: ${colorBoton}; color: ${colorBotonTexto}">${textoBoton} →</span>
        </div>
    `;
}

async function saveCard() {
    const cardId = document.getElementById('cardId').value;
    const cardData = {
        titulo: document.getElementById('cardTitulo').value,
        subtitulo: document.getElementById('cardSubtitulo').value,
        imagen: document.getElementById('cardImagen').value,
        textoBoton: document.getElementById('cardTextoBoton').value,
        filtros: document.getElementById('cardFiltros').value,
        colorFondo: document.getElementById('cardColorFondo').value,
        colorTexto: document.getElementById('cardColorTexto').value,
        colorBoton: document.getElementById('cardColorBoton').value,
        colorBotonTexto: document.getElementById('cardColorBotonTexto').value,
        orden: parseInt(document.getElementById('cardOrden').value) || 0,
        activo: document.getElementById('cardActivo').checked
    };
    
    if (!cardData.titulo || !cardData.filtros) {
        showToast('Título y filtros son requeridos', 'error');
        return;
    }
    
    try {
        let res;
        if (cardId) {
            res = await API.put(`/api/page-config/${PAGE_SLUG}/cards/${cardId}`, cardData);
        } else {
            res = await API.post(`/api/page-config/${PAGE_SLUG}/cards`, cardData);
        }
        
        if (res.data.success) {
            pageConfig = res.data.data;
            renderCards();
            bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
            showToast(cardId ? 'Card actualizada' : 'Card creada');
        }
    } catch (err) {
        console.error('Error saving card:', err);
        showToast('Error al guardar', 'error');
    }
}

async function deleteCard() {
    const cardId = document.getElementById('cardId').value;
    if (!cardId) return;
    
    if (!confirm('¿Eliminar esta card?')) return;
    
    try {
        const res = await API.delete(`/api/page-config/${PAGE_SLUG}/cards/${cardId}`);
        if (res.data.success) {
            pageConfig = res.data.data;
            renderCards();
            bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
            showToast('Card eliminada');
        }
    } catch (err) {
        console.error('Error deleting card:', err);
        showToast('Error al eliminar', 'error');
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `cm-toast cm-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function syncColorInputs() {
    const pairs = [
        ['cardColorFondo', 'cardColorFondoText'],
        ['cardColorTexto', 'cardColorTextoText'],
        ['cardColorBoton', 'cardColorBotonText'],
        ['cardColorBotonTexto', 'cardColorBotonTextoText']
    ];
    
    pairs.forEach(([colorId, textId]) => {
        const colorInput = document.getElementById(colorId);
        const textInput = document.getElementById(textId);
        
        colorInput?.addEventListener('input', () => {
            textInput.value = colorInput.value;
            updatePreview();
        });
        
        textInput?.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                colorInput.value = textInput.value;
                updatePreview();
            }
        });
    });
}

function initEventListeners() {
    document.getElementById('btnToggleEdit')?.addEventListener('click', toggleEditMode);
    document.getElementById('btnAddCard')?.addEventListener('click', () => openEditModal());
    document.getElementById('btnSaveCard')?.addEventListener('click', saveCard);
    document.getElementById('btnDeleteCard')?.addEventListener('click', deleteCard);
    
    ['cardTitulo', 'cardTextoBoton'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updatePreview);
    });
    
    // Image upload
    document.getElementById('cardImagenFile')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('La imagen no debe superar 5MB', 'error');
                return;
            }
            uploadImage(file);
        }
    });
    
    document.getElementById('btnRemoveImage')?.addEventListener('click', removeImage);
    
    syncColorInputs();
}

document.addEventListener('DOMContentLoaded', async () => {
    initEventListeners();
    await checkAdminStatus();
    await loadPageConfig();
});
