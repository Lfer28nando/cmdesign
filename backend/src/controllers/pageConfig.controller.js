import { PageConfig } from "../models/pageConfig.model.js";

export const getPageConfig = async (req, res, next) => {
    try {
        const { slug } = req.params;
        
        let config = await PageConfig.findOne({ slug });
        
        if (!config) {
            config = await PageConfig.create({
                slug,
                titulo: slug.charAt(0).toUpperCase() + slug.slice(1),
                descripcion: `Página de ${slug}`,
                cards: []
            });
        }
        
        res.json({ success: true, data: config });
    } catch (error) {
        next(error);
    }
};

export const updatePageConfig = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { titulo, descripcion, cards, activo } = req.body;
        
        const updateData = {};
        if (titulo !== undefined) updateData.titulo = titulo;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (cards !== undefined) updateData.cards = cards;
        if (activo !== undefined) updateData.activo = activo;
        
        const config = await PageConfig.findOneAndUpdate(
            { slug },
            updateData,
            { new: true, upsert: true, runValidators: true }
        );
        
        res.json({ success: true, message: 'Configuración actualizada', data: config });
    } catch (error) {
        next(error);
    }
};

export const addCard = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const cardData = req.body;
        
        const config = await PageConfig.findOneAndUpdate(
            { slug },
            { $push: { cards: cardData } },
            { new: true, upsert: true }
        );
        
        res.json({ success: true, message: 'Card añadida', data: config });
    } catch (error) {
        next(error);
    }
};

export const updateCard = async (req, res, next) => {
    try {
        const { slug, cardId } = req.params;
        const cardData = req.body;
        
        const config = await PageConfig.findOneAndUpdate(
            { slug, 'cards._id': cardId },
            { $set: { 'cards.$': { ...cardData, _id: cardId } } },
            { new: true }
        );
        
        if (!config) {
            return res.status(404).json({ success: false, message: 'Card no encontrada' });
        }
        
        res.json({ success: true, message: 'Card actualizada', data: config });
    } catch (error) {
        next(error);
    }
};

export const deleteCard = async (req, res, next) => {
    try {
        const { slug, cardId } = req.params;
        
        const config = await PageConfig.findOneAndUpdate(
            { slug },
            { $pull: { cards: { _id: cardId } } },
            { new: true }
        );
        
        if (!config) {
            return res.status(404).json({ success: false, message: 'Página no encontrada' });
        }
        
        res.json({ success: true, message: 'Card eliminada', data: config });
    } catch (error) {
        next(error);
    }
};

export const reorderCards = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { cardIds } = req.body;
        
        const config = await PageConfig.findOne({ slug });
        if (!config) {
            return res.status(404).json({ success: false, message: 'Página no encontrada' });
        }
        
        const cardsMap = {};
        config.cards.forEach(card => {
            cardsMap[card._id.toString()] = card;
        });
        
        const reorderedCards = cardIds.map((id, index) => {
            const card = cardsMap[id];
            if (card) {
                card.orden = index;
                return card;
            }
            return null;
        }).filter(Boolean);
        
        config.cards = reorderedCards;
        await config.save();
        
        res.json({ success: true, message: 'Cards reordenadas', data: config });
    } catch (error) {
        next(error);
    }
};

export const uploadCardImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se subió ninguna imagen' });
        }
        
        const imageUrl = `/uploads/pages/${req.file.filename}`;
        
        res.json({ 
            success: true, 
            message: 'Imagen subida', 
            data: { url: imageUrl, filename: req.file.filename } 
        });
    } catch (error) {
        next(error);
    }
};
