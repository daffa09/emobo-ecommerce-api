import { Request, Response } from "express";
import { sendResponse } from "~/utils/response";
import * as service from "./payment.service";
import prisma from "~/prisma";

export const createPayment = async (req: Request, res: Response) => {
  const orderId = Number(req.params.orderId);
  try {
    const payment = await service.createMidtransPayment(orderId);
    return sendResponse(res, 201, "payment created", payment);
  } catch (err: any) {
    console.error("Midtrans create error:", err);
    return sendResponse(res, 400, err.message);
  }
};

// webhook endpoint for Midtrans
export const webhook = async (req: Request, res: Response) => {
  try {
    await service.handleMidtransNotification(req.body);
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Midtrans webhook error:", err);
    return res.status(400).send("ERROR");
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  const orderId = Number(req.params.orderId);
  const payment = await prisma.payment.findUnique({ where: { orderId }});
  if (!payment) return sendResponse(res, 404, "payment not found");
  return sendResponse(res, 200, "fetch data success", payment);
};
