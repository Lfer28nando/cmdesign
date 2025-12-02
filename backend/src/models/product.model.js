//Imports:
import mongoose from "mongoose";


//Schemas:
 //Esquema para las variantes del producto (tamaño, color, etc.)
const varianteSchema = new mongoose.Schema({
    atributo: { type: String, required: true }, //ej "Color", "Tamaño"
    valor: { type: String, required: true }, //es el valor del atributo, ej "Rojo", "XL"
    precioAdicional: { type: Number, required: false, default: 0 }, //precio adicional por esta variante
    stock: { type: Number, required: true, default: 0 } //stock específico para esta variante
}, { _id: false });

 //Esquema para las listas de precios por canal de venta
const listaPreciosSchema = new mongoose.Schema({
    canal: { type: String, required: true }, //ej "Retail", "Mayorista"
    precio: { type: Number, required: true }, //precio para este canal
}, { _id: false });

 //Esquema para las calificaciones y reseñas de productos
const calificacionSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }, //referencia al usuario que hizo la reseña
  estrellas: { type: Number, min: 1, max: 5 }, //calificación de 1 a 5
  comentario: { type: String }, //comentario de la reseña
  fecha: { type: Date, default: Date.now } //fecha de la reseña
}, { _id: false });

    //Esquema principal de Producto
const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  precioBase: { type: Number, required: true },
  precioOriginal: { type: Number }, // Precio antes de descuento (si aplica)
  disponibilidad: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },

  // RF-PROD-04
  imagenes: [{ type: String }],
  fichaTecnica: { type: String },

  // RF-PROD-05
  variantes: [varianteSchema],

  // RF-PROD-06
  listasPrecios: [listaPreciosSchema],

  // RF-PROD-08 SEO
  seo: {
    slug: { type: String, unique: true },
    metaTitulo: { type: String },
    metaDescripcion: { type: String }
  },

  // RF-PROD-15
  calificaciones: [calificacionSchema],

  // RF-PROD-16
  etiquetas: [{ type: String }],

  // RF-PROD-17
  canalesVisibilidad: [{ type: String }],

  // Filtros de catalogo (administrables)
  categoria: { type: String },
  subcategoria: { type: String },
  edad: { type: String },        // ej: 'Adulto', 'Nino', 'Bebe'
  genero: { type: String },      // ej: 'Hombre', 'Mujer', 'Unisex'
  marca: { type: String },       // ej: 'Marvel', 'DC', 'Disney'
  personaje: { type: String },   // ej: 'Spider-Man', 'Batman'
  coleccion: { type: String },   // ej: 'Navidad 2024', 'Verano'
  tallasDisponibles: [{ type: String }], // ej: ['S', 'M', 'L', 'XL']

  // Extras
  relacionados: [{ type: mongoose.Schema.Types.ObjectId, ref: "Producto" }],
  ventas: { type: Number, default: 0 }, // Para ordenar por mas vendidos

  creadoEn: { type: Date, default: Date.now },
  actualizadoEn: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Pre-save para slug (sirve para que  
productoSchema.pre("save", function(next) {
  if (!this.seo.slug && this.nombre) {
    this.seo.slug = this.nombre.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .replace(/\s+/g, "-"); // espacios por guiones
  }
  next();
});

// Indexaciones RF-10 y RF-11

// RF-10: búsqueda de texto
productoSchema.index({
  nombre: "text",
  descripcion: "text",
  categoria: "text",
  "seo.metaTitulo": "text",
  "seo.metaDescripcion": "text"
});

// RF-11: filtros comunes
productoSchema.index({ categoria: 1 });
productoSchema.index({ subcategoria: 1 });
productoSchema.index({ edad: 1 });
productoSchema.index({ genero: 1 });
productoSchema.index({ marca: 1 });
productoSchema.index({ personaje: 1 });
productoSchema.index({ coleccion: 1 });
productoSchema.index({ disponibilidad: 1 });
productoSchema.index({ precioBase: 1 });
productoSchema.index({ ventas: -1 });

export const Producto = mongoose.model("Producto", productoSchema);