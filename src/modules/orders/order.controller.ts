import { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import * as service from "./order.service";

export const createOrder = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;
  const { items, shippingAddr, phone, shippingCost, shippingService } = req.body;

  try {
    const order = await service.createOrder(
      userId,
      items,
      shippingAddr,
      phone,
      shippingCost,
      shippingService
    );
    return sendResponse(res, 201, "order created", order);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
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

export const listAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await service.listAllOrders();
    return sendResponse(res, 200, "fetch data success", orders);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  try {
    const order = await service.updateStatus(id, status);
    return sendResponse(res, 200, "order status updated", order);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};
