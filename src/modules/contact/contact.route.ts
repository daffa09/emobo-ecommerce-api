import { Router } from "express";
import { sendMessage, getMessages } from "./contact.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/role.middleware";

const router = Router();

router.post("/", sendMessage);
router.get("/", authMiddleware, adminOnly, getMessages);

export default router;
