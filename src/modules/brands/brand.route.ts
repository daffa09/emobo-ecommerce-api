import { Router } from "express";
import { createBrand, deleteBrand, getBrand, getBrands, updateBrand } from "./brand.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/role.middleware";

const router = Router();

router.get("/", getBrands);
router.get("/:id", getBrand);
router.post("/", authMiddleware, adminOnly, createBrand);
router.put("/:id", authMiddleware, adminOnly, updateBrand);
router.delete("/:id", authMiddleware, adminOnly, deleteBrand);

export default router;
