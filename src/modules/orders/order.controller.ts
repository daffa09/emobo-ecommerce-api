import { Request, Response } from "express";
import { sendResponse } from "~/utils/response";
import * as service from "./order.service";

export const createOrder = async (req: Request, res: Response) => {
  // @ts-ignore
  const user = req.user;
  const { items, shippingAddr, phone } = req.body;

  try {
    const order = await service.createOrder(user.id, items, shippingAddr, phone);
    return sendResponse(res, 201, "order created", order);
  } catch (err: any) {
    return sendResponse(res, 400, err.message || "create order failed");
  }
};

export const getOrder = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order = await service.getOrderWithItems(id);
  if (!order) return sendResponse(res, 404, "order not found");
  return sendResponse(res, 200, "fetch data success", order);
};

export const listOrdersForUser = async (req: Request, res: Response) => {
  // @ts-ignore
  const user = req.user;
  const orders = await service.listOrdersByUser(user.id);
  return sendResponse(res, 200, "fetch data success", orders);
};
