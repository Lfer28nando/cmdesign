// src/routes/web.routes.js
import { Router } from 'express';
import { 
    renderCart, 
    renderCheckout, 
    renderOrderConfirmed, 
    renderAdmin,
    renderHome, 
    renderDetailProduct,
    renderCatalog,
    renderLogin,
    renderRegister,
    renderShirts,
    renderNinos
} from '../controllers/views.controller.js';

// Si tienes middlewares de auth para proteger vistas (ej. admin), impórtalos aquí
// import { authRequired, adminOnly } from '../middlewares/validateToken.middleware.js';

const router = Router();

// Rutas Públicas
router.get('/', renderHome); 
router.get('/carrito', renderCart);
router.get('/checkout', renderCheckout);
router.get('/pedido-confirmado', renderOrderConfirmed);
router.get('/producto/:id', renderDetailProduct);
router.get('/catalogo', renderCatalog);
router.get('/login', renderLogin);
router.get('/register', renderRegister);
router.get('/ninos', renderNinos);
router.get('/shirts', renderShirts)
// Rutas Privadas (Ejemplo: Admin)
// Nota: Deberías agregar aquí tus middlewares de protección si no quieres que cualquiera entre
router.get('/admin', renderAdmin); 

export default router;