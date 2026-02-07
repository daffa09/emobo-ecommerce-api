import { Request, Response } from "express";
import prisma from "../../prisma";
import { sendResponse } from "../../utils/response";
import { notifyAdmins } from "../notifications/notification.controller";

export const sendMessage = async (req: Request, res: Response) => {
  const { firstName, lastName, subject, phone, message } = req.body;

  try {
    const contactMessage = await prisma.contactMessage.create({
      data: { firstName, lastName, subject, phone, message },
    });

    // Notify admins about the new message
    await notifyAdmins(
      "New Contact Message",
      `You have a new message from ${firstName} ${lastName}: ${subject}`,
      "MESSAGE"
    );

    return sendResponse(res, 201, "message sent successfully", contactMessage);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

export const getMessages = async (_req: Request, res: Response) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return sendResponse(res, 200, "fetch messages success", messages);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};
