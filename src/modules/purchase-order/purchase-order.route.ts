import { Router } from "express";
import * as poc from "./purchase-order.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/role.middleware";

const router = Router();

/**
 * Purchase Order Routes
 * POST /api/purchase-order - Create PO
 * GET /api/purchase-order - List POs
 * GET /api/purchase-order/:id - Get PO details
 */

router.post("/", authMiddleware, adminOnly, poc.handleCreatePurchaseOrder);
router.get("/", authMiddleware, adminOnly, poc.handleListPurchaseOrders);
router.get("/:id", authMiddleware, adminOnly, poc.handleGetPurchaseOrder);

export default router;
