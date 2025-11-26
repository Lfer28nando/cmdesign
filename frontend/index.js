// ============================
// 📦 Dependencias
// ============================
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================
// ⚙️ Configuración base
// ============================
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================
// 🌍 Cargar BACKEND_URL desde entorno real
// ============================
const backendUrl = process.env.BACKEND_URL || 'NO_DEFINIDO';
app.locals.BACKEND_URL = backendUrl;

// Motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'src', 'public')));

// ============================
// 🛣️ Rutas
// ============================
const pages = [
  'index',
  'register',
  'login',
  'auth',
  'perfil',
  'recuperar',
  'admin',
  'catalogo',
  'carrito',
  'checkout',
  'pedido-confirmado',
  'producto/:id'
];

pages.forEach(page => {
  const route = page === 'index' ? '/' : `/${page}`;
  app.get(route, (req, res) => res.render(`pages/${page.replace('/:id', '')}`));
});

// ============================
// 🚀 Servidor
// ============================
const PORT = process.env.PORT || 5173;
app.listen(PORT, '0.0.0.0', () => {
  console.log('===========================================');
  console.log(`✅ Frontend corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 BACKEND_URL usado por app.locals: ${app.locals.BACKEND_URL}`);
  console.log('===========================================');
});
