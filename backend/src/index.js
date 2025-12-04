import dotenv from 'dotenv';
dotenv.config({quiet: true});

import app from './app.js';
import { connectDB } from './db.js';

console.log('Arrancando backend...');
console.log(`Cookie Domain: ${process.env.COOKIE_DOMAIN}`);

connectDB();

const PORT = process.env.PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV}`);

  if (process.env.NODE_ENV === 'development') {
    console.log(`Aplicación disponible en:' http://localhost:${process.env.PORT}`);
  }

  if (process.env.NODE_ENV === 'production') {
    console.log(`Aplicación disponible en: ${process.env.FRONTEND_URL}`);
  }
});
