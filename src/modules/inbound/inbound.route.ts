import { Router } from "express";
import * as poc from "./inbound.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/role.middleware";

const router = Router();

/**
 * Inbound Transaction Routes
 * POST /api/purchase-order - Create PO
 * GET /api/purchase-order - List POs
 * GET /api/purchase-order/:id - Get PO details
 */

router.post("/", authMiddleware, adminOnly, poc.handleCreateinboundTransaction);
router.get("/", authMiddleware, adminOnly, poc.handleListinboundTransactions);
router.get("/:id", authMiddleware, adminOnly, poc.handleGetinboundTransaction);

export default router;
