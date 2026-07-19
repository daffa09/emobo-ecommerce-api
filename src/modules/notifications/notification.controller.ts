import { Request, Response } from "express";
import prisma from "../../prisma";
import { sendResponse } from "../../utils/response";
import { asyncHandler } from "../../utils/async-handler";

const currentUserId = (req: Request) => (req as any).user.id as string;

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: currentUserId(req) },
    orderBy: { createdAt: "desc" },
  });

  return sendResponse(res, 200, "fetch notifications success", notifications);
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.update({
    where: { id: req.params.id, userId: currentUserId(req) },
    data: { isRead: true },
  });

  return sendResponse(res, 200, "notification marked as read", notification);
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: currentUserId(req), isRead: false },
    data: { isRead: true },
  });

  return sendResponse(res, 200, "all notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.delete({
    where: { id: req.params.id, userId: currentUserId(req) },
  });

  return sendResponse(res, 200, "notification deleted");
});

/**
 * Utility function to create a notification (Server-side use)
 */
export const createNotification = async (userId: string, title: string, message: string, type: string) => {
  return await prisma.notification.create({
    data: { userId, title, message, type },
  });
};

/**
 * Utility function to notify all admins
 */
export const notifyAdmins = async (title: string, message: string, type: string) => {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  return await prisma.notification.createMany({
    data: admins.map((admin) => ({ userId: admin.id, title, message, type })),
  });
};
