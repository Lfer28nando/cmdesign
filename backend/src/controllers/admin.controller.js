import User from "../models/user.model.js";
import { Producto as Product } from "../models/product.model.js";
import { Cupon } from "../models/coupon.model.js";
import { ZonaEnvio } from "../models/shippingArea.model.js";
import { Pedido } from "../models/order.model.js";
import { Categoria } from "../models/category.model.js";

// Dashboard principal del administrador
export const getAdminDashboard = async (req, res, next) => {
    try {
        // Estadísticas generales
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ disponibilidad: true });
        
        // Estadísticas de pedidos
        const totalOrders = await Pedido.countDocuments();
        const revenueData = await Pedido.aggregate([
            { $match: { estado: { $in: ['pagado', 'en_preparacion', 'enviado', 'entregado'] } } },
            { $group: { _id: null, total: { $sum: '$totales.total' } } }
        ]);
        const totalRevenue = revenueData[0]?.total || 0;

        // Usuarios por rol
        const usersByRole = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        // Productos recientes (últimos 10)
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('nombre precioBase disponibilidad createdAt');

        // Usuarios recientes (últimos 10)
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('username email role createdAt verifiedEmail');

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalProducts,
                    activeProducts,
                    inactiveProducts: totalProducts - activeProducts,
                    totalOrders,
                    totalRevenue
                },
                usersByRole,
                recentProducts,
                recentUsers
            }
        });

    } catch (error) {
        next(error);
    }
};

// Gestión de usuarios
export const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -twoFactorSecret -twoFactorBackupCodes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

// Actualizar rol de usuario
export const updateUserRole = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const validRoles = ['client', 'seller', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, select: '-password' }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Rol actualizado correctamente',
            user
        });

    } catch (error) {
        next(error);
    }
};

// Eliminar usuario (admin)
export const deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // No permitir que un admin se elimine a sí mismo
        if (userId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
            });
        }

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario eliminado correctamente'
        });

    } catch (error) {
        next(error);
    }
};

// Gestión de productos
export const getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const products = await Product.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments();

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

// Cambiar disponibilidad de producto
export const toggleProductAvailability = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        product.disponibilidad = !product.disponibilidad;
        await product.save();

        res.json({
            success: true,
            message: `Producto ${product.disponibilidad ? 'activado' : 'desactivado'} correctamente`,
            product
        });

    } catch (error) {
        next(error);
    }
};

// =============================================
// SELLERS
// =============================================
export const getSellers = async (req, res, next) => {
    try {
        const sellers = await User.find({ role: 'seller' })
            .select('username email informacionVendedor createdAt')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: { sellers } });
    } catch (error) {
        next(error);
    }
};

export const updateSellerCommission = async (req, res, next) => {
    try {
        const { sellerId } = req.params;
        const { porcentajeComision, metaMensual } = req.body;

        const seller = await User.findOneAndUpdate(
            { _id: sellerId, role: 'seller' },
            { 
                'informacionVendedor.porcentajeComision': porcentajeComision,
                'informacionVendedor.metaMensual': metaMensual
            },
            { new: true, select: 'username email informacionVendedor' }
        );

        if (!seller) {
            return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
        }

        res.json({ success: true, message: 'Comisión actualizada', data: seller });
    } catch (error) {
        next(error);
    }
};

// =============================================
// ORDERS
// =============================================
export const getOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        const query = status ? { estado: status } : {};
        
        const orders = await Pedido.find(query)
            .populate('usuarioId', 'username email')
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Pedido.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (req, res, next) => {
    try {
        const order = await Pedido.findById(req.params.orderId)
            .populate('usuarioId', 'username email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { estado } = req.body;

        const validStates = ['borrador', 'confirmado', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado', 'reembolsado'];
        if (!validStates.includes(estado)) {
            return res.status(400).json({ success: false, message: 'Estado inválido' });
        }

        const order = await Pedido.findByIdAndUpdate(
            orderId,
            { 
                estado,
                $push: { historialEstados: { estado, fecha: new Date(), cambiadoPor: req.user._id } }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }

        res.json({ success: true, message: 'Estado actualizado', data: order });
    } catch (error) {
        next(error);
    }
};

// =============================================
// COUPONS
// =============================================
export const getCoupons = async (req, res, next) => {
    try {
        const coupons = await Cupon.find().sort({ createdAt: -1 });
        res.json({ success: true, data: { coupons } });
    } catch (error) {
        next(error);
    }
};

export const getCouponById = async (req, res, next) => {
    try {
        const coupon = await Cupon.findById(req.params.couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }
        res.json({ success: true, data: coupon });
    } catch (error) {
        next(error);
    }
};

export const createCoupon = async (req, res, next) => {
    try {
        const coupon = new Cupon(req.body);
        await coupon.save();
        res.status(201).json({ success: true, message: 'Cupón creado', data: coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'El código ya existe' });
        }
        next(error);
    }
};

export const updateCoupon = async (req, res, next) => {
    try {
        const coupon = await Cupon.findByIdAndUpdate(
            req.params.couponId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }

        res.json({ success: true, message: 'Cupón actualizado', data: coupon });
    } catch (error) {
        next(error);
    }
};

export const deleteCoupon = async (req, res, next) => {
    try {
        const coupon = await Cupon.findByIdAndDelete(req.params.couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }
        res.json({ success: true, message: 'Cupón eliminado' });
    } catch (error) {
        next(error);
    }
};

// =============================================
// SHIPPING ZONES
// =============================================
export const getShippingZones = async (req, res, next) => {
    try {
        const zones = await ZonaEnvio.find().sort({ createdAt: -1 });
        res.json({ success: true, data: { zones } });
    } catch (error) {
        next(error);
    }
};

export const getShippingZoneById = async (req, res, next) => {
    try {
        const zone = await ZonaEnvio.findById(req.params.zoneId);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zona no encontrada' });
        }
        res.json({ success: true, data: zone });
    } catch (error) {
        next(error);
    }
};

export const createShippingZone = async (req, res, next) => {
    try {
        const zone = new ZonaEnvio(req.body);
        await zone.save();
        res.status(201).json({ success: true, message: 'Zona creada', data: zone });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'El código ya existe' });
        }
        next(error);
    }
};

export const updateShippingZone = async (req, res, next) => {
    try {
        const zone = await ZonaEnvio.findByIdAndUpdate(
            req.params.zoneId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zona no encontrada' });
        }

        res.json({ success: true, message: 'Zona actualizada', data: zone });
    } catch (error) {
        next(error);
    }
};

export const deleteShippingZone = async (req, res, next) => {
    try {
        const zone = await ZonaEnvio.findByIdAndDelete(req.params.zoneId);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zona no encontrada' });
        }
        res.json({ success: true, message: 'Zona eliminada' });
    } catch (error) {
        next(error);
    }
};

// =============================================
// REPORTS
// =============================================
export const getReports = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const dateFilter = {};
        
        if (from) dateFilter.$gte = new Date(from);
        if (to) dateFilter.$lte = new Date(to);
        
        const matchStage = Object.keys(dateFilter).length > 0 
            ? { fechaCreacion: dateFilter, estado: { $in: ['pagado', 'en_preparacion', 'enviado', 'entregado'] } }
            : { estado: { $in: ['pagado', 'en_preparacion', 'enviado', 'entregado'] } };

        const orderStats = await Pedido.aggregate([
            { $match: matchStage },
            { $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totales.total' },
                averageOrder: { $avg: '$totales.total' }
            }}
        ]);

        const topProducts = await Pedido.aggregate([
            { $match: matchStage },
            { $unwind: '$items' },
            { $group: {
                _id: '$items.productoId',
                nombre: { $first: '$items.nombreProducto' },
                cantidad: { $sum: '$items.cantidad' },
                ingresos: { $sum: '$items.subtotal' }
            }},
            { $sort: { cantidad: -1 } },
            { $limit: 10 }
        ]);

        const sellerCommissions = await User.aggregate([
            { $match: { role: 'seller' } },
            { $project: {
                username: 1,
                ventas: '$informacionVendedor.ventasTotales',
                comision: '$informacionVendedor.comisionesAcumuladas'
            }},
            { $sort: { comision: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                totalOrders: orderStats[0]?.totalOrders || 0,
                totalRevenue: orderStats[0]?.totalRevenue || 0,
                averageOrder: orderStats[0]?.averageOrder || 0,
                totalCommissions: sellerCommissions.reduce((sum, s) => sum + (s.comision || 0), 0),
                topProducts,
                sellerCommissions
            }
        });
    } catch (error) {
        next(error);
    }
};

// =============================================
// CATEGORIES
// =============================================
export const getCategoryById = async (req, res, next) => {
    try {
        const category = await Categoria.findById(req.params.categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        }
        res.json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req, res, next) => {
    try {
        const { nombre, tipo, descripcion, imagen, orden, activo, padre, generos } = req.body;
        console.log('createCategory body:', req.body);
        
        if (!nombre || !tipo) {
            return res.status(400).json({ success: false, message: 'Nombre y tipo son requeridos' });
        }
        
        const categoryData = { nombre, tipo, descripcion, imagen, orden, activo };
        
        if (tipo === 'subcategoria' && padre) {
            categoryData.padre = padre;
        }
        
        if (tipo === 'categoria' && generos?.length) {
            categoryData.generos = generos;
        }
        
        console.log('Creating category with data:', categoryData);
        const category = new Categoria(categoryData);
        await category.save();
        console.log('Category created:', category);
        res.status(201).json({ success: true, message: 'Categoría creada', data: category });
    } catch (error) {
        console.error('createCategory error:', error);
        next(error);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const category = await Categoria.findByIdAndUpdate(
            req.params.categoryId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        }

        res.json({ success: true, message: 'Categoría actualizada', data: category });
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        const category = await Categoria.findByIdAndDelete(req.params.categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        }
        res.json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
        next(error);
    }
};