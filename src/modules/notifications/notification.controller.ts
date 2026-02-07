import { Request, Response } from "express";
import prisma from "../../prisma";
import { sendResponse } from "../../utils/response";

export const getNotifications = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return sendResponse(res, 200, "fetch notifications success", notifications);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  // @ts-ignore
  const userId = req.user.id;

  try {
    const notification = await prisma.notification.update({
      where: { id: Number(id), userId },
      data: { isRead: true },
    });

    return sendResponse(res, 200, "notification marked as read", notification);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  // @ts-ignore
  const userId = req.user.id;

  try {
    await prisma.notification.delete({
      where: { id: Number(id), userId },
    });

    return sendResponse(res, 200, "notification deleted");
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

/**
 * Utility function to create a notification (Server-side use)
 */
export const createNotification = async (userId: number, title: string, message: string, type: string) => {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
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

  const notifications = admins.map((admin) => ({
    userId: admin.id,
    title,
    message,
    type,
  }));

  return await prisma.notification.createMany({
    data: notifications,
  });
};
