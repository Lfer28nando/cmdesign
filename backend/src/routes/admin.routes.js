import express from 'express';
import { onlyAdmin } from '../middlewares/validateRole.middleware.js';
import { authRequired } from '../middlewares/validateToken.middleware.js';
import {
    getAdminDashboard,
    getUsers,
    updateUserRole,
    deleteUser,
    getProducts,
    toggleProductAvailability,
    getSellers,
    updateSellerCommission,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getShippingZones,
    getShippingZoneById,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone,
    getReports,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/admin.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authRequired, onlyAdmin);

// Dashboard principal
router.get('/dashboard', getAdminDashboard);

// Gestión de usuarios
router.get('/users', getUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Gestión de productos
router.get('/products', getProducts);
router.patch('/products/:productId/availability', toggleProductAvailability);

// Gestión de categorías
router.get('/categories/:categoryId', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:categoryId', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Gestión de vendedores
router.get('/sellers', getSellers);
router.put('/sellers/:sellerId/commission', updateSellerCommission);

// Gestión de pedidos
router.get('/orders', getOrders);
router.get('/orders/:orderId', getOrderById);
router.patch('/orders/:orderId/status', updateOrderStatus);

// Gestión de cupones
router.get('/coupons', getCoupons);
router.get('/coupons/:couponId', getCouponById);
router.post('/coupons', createCoupon);
router.put('/coupons/:couponId', updateCoupon);
router.delete('/coupons/:couponId', deleteCoupon);

// Gestión de zonas de envío
router.get('/shipping-zones', getShippingZones);
router.get('/shipping-zones/:zoneId', getShippingZoneById);
router.post('/shipping-zones', createShippingZone);
router.put('/shipping-zones/:zoneId', updateShippingZone);
router.delete('/shipping-zones/:zoneId', deleteShippingZone);

// Reportes
router.get('/reports', getReports);

export default router;