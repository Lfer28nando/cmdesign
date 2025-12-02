// public/js/guestGuard.functions.js (ESM)
import { API } from './api.functions.js';

export default async function guardGuest(redirectTo = '/') {
  try {
    // Intentar obtener perfil - si hay sesion valida, redirigir
    const res = await API.get('/auth/me');
    if (res?.data?.ok && res.data.user) {
      window.location.replace(redirectTo);
      return;
    }
  } catch (err) {
    // Si /auth/me falla, intentar /api/auth/profile
    try {
      const res = await API.get('/api/auth/profile');
      if (res?.data?.success && res.data.user) {
        window.location.replace(redirectTo);
        return;
      }
    } catch (err2) {
      // No autenticado, permitir ver la pagina
    }
  }
}
