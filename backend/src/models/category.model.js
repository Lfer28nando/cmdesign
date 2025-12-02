import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { 
    type: String, 
    required: true,
    enum: ['categoria', 'subcategoria', 'edad', 'genero', 'marca', 'personaje', 'coleccion', 'talla']
  },
  descripcion: { type: String },
  imagen: { type: String },
  orden: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
  // Para subcategorías: referencia a la categoría padre
  padre: { type: mongoose.Schema.Types.ObjectId, ref: "Categoria" },
  // Para categorías: géneros a los que pertenece (muchos a muchos)
  generos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Categoria" }]
}, {
  timestamps: true
});

categorySchema.index({ tipo: 1, activo: 1 });
categorySchema.index({ tipo: 1, orden: 1 });
categorySchema.index({ generos: 1 });

export const Categoria = mongoose.model("Categoria", categorySchema);
