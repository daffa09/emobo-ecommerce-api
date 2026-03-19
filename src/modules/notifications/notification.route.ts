import { Router } from "express";
import { getNotifications, markAsRead, deleteNotification, markAllRead } from "./notification.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/mark-all-read", authMiddleware, markAllRead);
router.patch("/:id/read", authMiddleware, markAsRead);
router.delete("/:id", authMiddleware, deleteNotification);

export default router;
