import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
    getPageConfig,
    updatePageConfig,
    addCard,
    updateCard,
    deleteCard,
    reorderCards,
    uploadCardImage
} from "../controllers/pageConfig.controller.js";
import { authRequired } from "../middlewares/validateToken.middleware.js";
import { onlyAdmin } from "../middlewares/validateRole.middleware.js";

const router = Router();

// Multer config para imágenes de cards
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = "uploads/pages/";
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, `card-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

router.get("/:slug", getPageConfig);

router.put("/:slug", authRequired, onlyAdmin, updatePageConfig);
router.post("/:slug/cards", authRequired, onlyAdmin, addCard);
router.put("/:slug/cards/:cardId", authRequired, onlyAdmin, updateCard);
router.delete("/:slug/cards/:cardId", authRequired, onlyAdmin, deleteCard);
router.post("/:slug/cards/reorder", authRequired, onlyAdmin, reorderCards);
router.post("/:slug/upload-image", authRequired, onlyAdmin, upload.single('image'), uploadCardImage);

export default router;
