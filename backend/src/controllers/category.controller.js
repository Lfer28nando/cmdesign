import { Categoria } from "../models/category.model.js";
import { createError } from "../utils/customError.js";

export const getAllCategories = async (req, res, next) => {
  try {
    const { tipo, activo } = req.query;
    const filter = {};
    
    if (tipo) filter.tipo = tipo;
    if (activo !== undefined) filter.activo = activo === 'true';
    
    console.log('getAllCategories filter:', filter);
    const categorias = await Categoria.find(filter).sort({ tipo: 1, orden: 1 });
    console.log('getAllCategories found:', categorias.length);
    res.json({ ok: true, data: categorias });
  } catch (error) {
    console.error('getAllCategories error:', error);
    next(error);
  }
};

export const getCategoriesByType = async (req, res, next) => {
  try {
    const categorias = await Categoria.find({ activo: true }).sort({ tipo: 1, orden: 1 });
    
    const grouped = {
      categoria: [],
      subcategoria: [],
      edad: [],
      genero: [],
      marca: [],
      personaje: [],
      coleccion: [],
      talla: []
    };
    
    categorias.forEach(cat => {
      if (grouped[cat.tipo]) {
        const item = {
          _id: cat._id,
          nombre: cat.nombre,
          imagen: cat.imagen
        };
        if (cat.tipo === 'subcategoria' && cat.padre) {
          item.padre = cat.padre;
        }
        if (cat.tipo === 'categoria' && cat.generos?.length) {
          item.generos = cat.generos;
        }
        grouped[cat.tipo].push(item);
      }
    });
    
    res.json({ ok: true, data: grouped });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { nombre, tipo, descripcion, imagen, orden, activo, padre, generos } = req.body;
    
    if (!nombre || !tipo) {
      return next(createError('VAL_REQUIRED', { fields: ['nombre', 'tipo'] }));
    }
    
    const validTypes = ['categoria', 'subcategoria', 'edad', 'genero', 'marca', 'personaje', 'coleccion', 'talla'];
    if (!validTypes.includes(tipo)) {
      return next(createError('VAL_INVALID', { field: 'tipo', valid: validTypes }));
    }
    
    const categoriaData = { nombre, tipo, descripcion, imagen, orden, activo };
    
    if (tipo === 'subcategoria' && padre) {
      categoriaData.padre = padre;
    }
    
    if (tipo === 'categoria' && generos?.length) {
      categoriaData.generos = generos;
    }
    
    const categoria = new Categoria(categoriaData);
    await categoria.save();
    
    res.status(201).json({ ok: true, data: categoria });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const categoria = await Categoria.findByIdAndUpdate(id, updates, { new: true });
    if (!categoria) {
      return next(createError('CAT_01'));
    }
    
    res.json({ ok: true, data: categoria });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const categoria = await Categoria.findByIdAndDelete(id);
    if (!categoria) {
      return next(createError('CAT_01'));
    }
    
    res.json({ ok: true, message: 'Categoria eliminada' });
  } catch (error) {
    next(error);
  }
};

export const bulkCreateCategories = async (req, res, next) => {
  try {
    const { categorias } = req.body;
    
    if (!Array.isArray(categorias) || categorias.length === 0) {
      return next(createError('VAL_REQUIRED', { fields: ['categorias'] }));
    }
    
    const result = await Categoria.insertMany(categorias, { ordered: false });
    res.status(201).json({ ok: true, data: result, count: result.length });
  } catch (error) {
    next(error);
  }
};
