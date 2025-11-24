import { Request, Response } from "express";
import { sendResponse } from "~/utils/response";
import * as service from "./payment.service";
import prisma from "~/prisma";

export const createPayment = async (req: Request, res: Response) => {
  const orderId = Number(req.params.orderId);
  try {
    const payment = await service.createMockQRPayment(orderId);
    return sendResponse(res, 201, "payment created", payment);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

// webhook endpoint that provider would call
export const webhook = async (req: Request, res: Response) => {
  // mock provider will send { providerId, status }
  const { providerId, status } = req.body;
  if (status === "PAID") {
    try {
      const result = await service.handleMockProviderNotification(providerId);
      return res.status(200).send("OK");
    } catch (err) {
      return res.status(400).send("ERROR");
    }
  }
  return res.status(200).send("IGNORED");
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  const orderId = Number(req.params.orderId);
  const payment = await prisma.payment.findUnique({ where: { orderId }});
  if (!payment) return sendResponse(res, 404, "payment not found");
  return sendResponse(res, 200, "fetch data success", payment);
};
