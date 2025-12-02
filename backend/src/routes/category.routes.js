import { Router } from "express";
import { 
  getAllCategories, 
  getCategoriesByType, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  bulkCreateCategories
} from "../controllers/category.controller.js";
import { authRequired } from "../middlewares/validateToken.middleware.js";
import { onlyAdmin } from "../middlewares/validateRole.middleware.js";

const router = Router();

router.get("/", getCategoriesByType);
router.get("/all", authRequired, onlyAdmin, getAllCategories);
router.post("/", authRequired, onlyAdmin, createCategory);
router.post("/bulk", authRequired, onlyAdmin, bulkCreateCategories);
router.put("/:id", authRequired, onlyAdmin, updateCategory);
router.delete("/:id", authRequired, onlyAdmin, deleteCategory);

export default router;
