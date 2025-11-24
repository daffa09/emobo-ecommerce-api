import { Request, Response } from "express";
import prisma from "~/prisma";
import { sendResponse } from "~/utils/response";

export const listCustomers = async (_req: Request, res: Response) => {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return sendResponse(res, 200, "fetch data success", customers);
};

export const getCustomer = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const customer = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
  if (!customer) return sendResponse(res, 404, "customer not found");
  return sendResponse(res, 200, "fetch data success", customer);
};
