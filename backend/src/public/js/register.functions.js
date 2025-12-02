// public/js/register.functions.js
// Modulo que importa API y maneja el registro (formulario)

import { API } from './api.functions.js';

// Toast notification system
const showToast = (message, type = 'info') => {
  const existing = document.querySelector('.cm-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'cm-toast';
  
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  toast.innerHTML = `
    <div class="fixed top-4 right-4 z-[9999] flex items-center gap-3 ${colors[type]} text-white px-5 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300" id="toastInner">
      ${icons[type]}
      <span class="text-sm font-medium">${message}</span>
      <button onclick="this.closest('.cm-toast').remove()" class="ml-2 opacity-70 hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    const inner = document.getElementById('toastInner');
    if (inner) inner.classList.remove('translate-x-full');
  });

  setTimeout(() => {
    const inner = document.getElementById('toastInner');
    if (inner) {
      inner.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
};

const initRegister = () => {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordFeedback = document.getElementById('passwordFeedback');
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn?.innerHTML || 'Crear Cuenta';

  const setLoading = (loading) => {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (loading) {
      submitBtn.innerHTML = `
        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Creando cuenta...
      `;
    } else {
      submitBtn.innerHTML = originalBtnText;
    }
  };

  const checkPasswords = () => {
    if (!confirmPassword || !passwordFeedback) return;
    if (confirmPassword.value.length === 0) {
      passwordFeedback.textContent = 'Recomendamos usar al menos 8 caracteres con mayusculas, numeros y simbolos.';
      passwordFeedback.className = 'mt-1 text-xs text-gray-500';
      return;
    }
    if (password.value !== confirmPassword.value) {
      passwordFeedback.textContent = 'Las contrasenas no coinciden.';
      passwordFeedback.className = 'mt-1 text-xs text-yellow-400';
    } else {
      passwordFeedback.textContent = 'Las contrasenas coinciden.';
      passwordFeedback.className = 'mt-1 text-xs text-green-400';
    }
  };

  password?.addEventListener('input', checkPasswords);
  confirmPassword?.addEventListener('input', checkPasswords);

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);
    const payload = {
      username: formData.get('username')?.trim(),
      cellphone: formData.get('cellphone')?.trim(),
      email: formData.get('email')?.trim(),
      password: formData.get('password')
    };

    if (!payload.username || !payload.email || !payload.password) {
      return showToast('Por favor completa los campos obligatorios.', 'warning');
    }
    if (payload.username.length < 3) {
      return showToast('El nombre de usuario debe tener al menos 3 caracteres.', 'warning');
    }
    if (payload.password.length < 6) {
      return showToast('La contrasena debe tener al menos 6 caracteres.', 'warning');
    }
    if (payload.password !== formData.get('confirmPassword')) {
      return showToast('Las contrasenas no coinciden.', 'warning');
    }
    if (!formData.get('acceptTerms')) {
      return showToast('Debes aceptar los terminos y condiciones.', 'warning');
    }

    setLoading(true);

    try {
      const res = await API.post('/api/auth/register', payload);
      
      if (res?.data?.token) {
        localStorage.setItem('vn_token', res.data.token);
      }
      
      showToast('Cuenta creada exitosamente. Redirigiendo...', 'success');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (err) {
      console.error('Register error', err);
      const message = err.response?.data?.message || err.message || 'Error en el registro';
      showToast(message, 'error');
      setLoading(false);
    }
  });
};

export default initRegister;

document.addEventListener('DOMContentLoaded', initRegister);
