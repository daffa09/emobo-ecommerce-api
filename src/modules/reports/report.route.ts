import { Router } from "express";
import * as controller from "./report.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/role.middleware";

const router = Router();

router.get("/sales", authMiddleware, adminOnly, controller.getSalesReport);
router.get("/incoming", authMiddleware, adminOnly, controller.getIncomingGoodsReport);

export default router;
