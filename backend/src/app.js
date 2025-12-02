import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';

// Routes
import authRoutes from "./routes/auth.routes.js";
import googleAuthRoutes from "./routes/googleAuth.routes.js";
import productoRoutes from "./routes/product.routes.js";
import shopCartRoutes from "./routes/shopCart.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import pageConfigRoutes from "./routes/pageConfig.routes.js";
import webRoutes from "./routes/web.routes.js";

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';
import { 
    generalLimiter, 
    trustProxyMiddleware, 
    logRateLimit 
} from './middlewares/rateLimiter.middleware.js';

// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// ================================================================
// VALIDAR VARIABLES DE ENTORNO CRÍTICAS
// ================================================================
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'SESSION_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
}

// ================================================================
// INICIALIZAR EXPRESS
// ================================================================
const app = express();

// ================================================================
// 1. CONFIGURACIÓN DE SEGURIDAD Y PROXY
// ================================================================
trustProxyMiddleware(app);

// ================================================================
// 2. RATE LIMITING
// ================================================================
app.use(generalLimiter);
app.use(logRateLimit);

// ================================================================
// 3. ARCHIVOS ESTÁTICOS (ANTES DE CORS)
// ================================================================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ================================================================
// 4. CORS (SOLO PARA API, NO ARCHIVOS ESTÁTICOS)
// ================================================================
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = allowedOriginsEnv.split(',').map(s => s.trim()).filter(Boolean);

if (allowedOrigins.length === 0) {
    console.warn('⚠️  No CORS origins configured. Using default: http://localhost:5173');
    allowedOrigins.push('http://localhost:5173');
}

console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin.trim().replace(/\/+$/, ''))) {
            return callback(null, true);
        }
        
        console.warn(`[CORS] Rejected origin: ${origin}`);
        return callback(new Error('CORS: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// ================================================================
// 5. PARSERS Y LOGGING
// ================================================================
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ================================================================
// 6. SESIONES
// ================================================================
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        dbName: process.env.DB_NAME,
        touchAfter: 24 * 3600
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// ================================================================
// 7. MOTOR DE VISTAS EJS
// ================================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ================================================================
// 8. VARIABLES GLOBALES PARA VISTAS
// ================================================================
app.use((req, res, next) => {
    // Para el cliente, BACKEND_URL debe ser la URL completa (con protocolo)
    // Si no está definida, usar la URL del request actual
    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    
    res.locals.BACKEND_URL = backendUrl;
    res.locals.FRONTEND_URL = process.env.FRONTEND_URL || backendUrl;
    res.locals.NODE_ENV = process.env.NODE_ENV || 'development';
    res.locals.user = req.user || null;
    res.locals.session = req.session || null;
    next();
});

// ================================================================
// 9. HEALTH CHECK
// ================================================================
app.get('/health', (req, res) => {
    res.status(200).json({ 
        ok: true, 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    });
});

// ================================================================
// 10. RUTAS API (JSON)
// ================================================================
app.use("/api/auth", authRoutes);
app.use("/auth", googleAuthRoutes);
app.use("/api/products", productoRoutes);
app.use("/api/cart", shopCartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/page-config", pageConfigRoutes);

// ================================================================
// 11. RUTAS WEB (HTML/EJS)
// ================================================================
app.use("/", webRoutes);

// ================================================================
// 12. MANEJO DE ERRORES (SIEMPRE AL FINAL)
// ================================================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;