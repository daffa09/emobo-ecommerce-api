import { Router } from "express";
import * as ctrl from "./user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/profile", authMiddleware, ctrl.getProfile);
router.put("/profile", authMiddleware, ctrl.updateProfile);
router.get("/contact", ctrl.getAdminContact);

export default router;
