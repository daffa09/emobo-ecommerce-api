import { Request, Response } from "express";
import prisma from "../../prisma";
import { sendResponse } from "../../utils/response";

export const getProfile = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  if (!user) return sendResponse(res, 404, "User not found");

  return sendResponse(res, 200, "fetch profile success", user);
};

export const updateProfile = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;
  const { name, phone, image } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, image },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return sendResponse(res, 200, "profile updated", user);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

export const getAdminContact = async (_req: Request, res: Response) => {
  const admin = await prisma.user.findFirst({
    where: { 
      role: "ADMIN",
      phone: { not: null }
    },
    select: { phone: true }
  });

  if (!admin) return sendResponse(res, 404, "Admin contact not found");

  return sendResponse(res, 200, "fetch admin contact success", admin);
};
