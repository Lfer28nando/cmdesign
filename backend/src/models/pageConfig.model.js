import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  subtitulo: { type: String },
  imagen: { type: String },
  colorFondo: { type: String, default: '#1a1a1a' },
  colorTexto: { type: String, default: '#ffffff' },
  colorBoton: { type: String, default: '#ffffff' },
  colorBotonTexto: { type: String, default: '#1a1a1a' },
  textoBoton: { type: String, default: 'Ver colección' },
  filtros: { type: String, required: true },
  orden: { type: Number, default: 0 },
  activo: { type: Boolean, default: true }
}, { _id: true });

const pageConfigSchema = new mongoose.Schema({
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  titulo: { type: String, required: true },
  descripcion: { type: String },
  cards: [cardSchema],
  activo: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const PageConfig = mongoose.model("PageConfig", pageConfigSchema);
