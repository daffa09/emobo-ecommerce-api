import { Router } from "express";
import * as controller from "./report.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/role.middleware";

const router = Router();

router.get("/sales", authMiddleware, adminOnly, controller.getSalesReport);
router.get("/incoming", authMiddleware, adminOnly, controller.getIncomingGoodsReport);

router.get("/outbound", authMiddleware, adminOnly, controller.getOutboundGoodsReport);
router.get("/stock", authMiddleware, adminOnly, controller.getCurrentStockReport);
router.get("/shipping", authMiddleware, adminOnly, controller.getShippingReport);
router.get("/sales-by-brand", authMiddleware, adminOnly, controller.getSalesByBrandYearly);

export default router;
