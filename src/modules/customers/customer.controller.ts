import { Request, Response } from "express";
import prisma from "../../prisma";
import { sendResponse } from "../../utils/response";

export const listCustomers = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, email: true, role: true, createdAt: true, profile: { select: { name: true, phone: true, address: true } } },
  });
  const customers = users.map(u => ({ ...u, name: u.profile?.name, phone: u.profile?.phone, address: u.profile?.address, profile: undefined }));
  return sendResponse(res, 200, "fetch data success", customers);
};

export const getCustomer = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = await prisma.user.findUnique({ 
    where: { id }, 
    select: { id: true, email: true, profile: { select: { name: true } } } 
  });
  const customer = user ? { ...user, name: user.profile?.name, profile: undefined } : null;
  if (!customer) return sendResponse(res, 404, "customer not found");
  return sendResponse(res, 200, "fetch data success", customer);
};
