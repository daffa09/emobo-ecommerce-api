import { Router } from "express";
import { createCondition, deleteCondition, getCondition, getConditions, updateCondition } from "./condition.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/role.middleware";

const router = Router();

router.get("/", getConditions);
router.get("/:id", getCondition);
router.post("/", authMiddleware, adminOnly, createCondition);
router.put("/:id", authMiddleware, adminOnly, updateCondition);
router.delete("/:id", authMiddleware, adminOnly, deleteCondition);

export default router;
