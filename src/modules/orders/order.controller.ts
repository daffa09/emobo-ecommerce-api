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
  console.log("GET order called with ID:", id, "typeof:", typeof id);
  
  if (isNaN(id)) {
    return sendResponse(res, 400, "Invalid order ID");
  }

  // @ts-ignore
  const { id: userId, role } = req.user;
  
  const order = await service.getOrderWithItems(id);
  if (!order) return sendResponse(res, 404, "order not found");

  // IDOR Protection: Check if user owns order or is Admin
  if (role !== "ADMIN" && order.userId !== userId) {
    return sendResponse(res, 403, "Forbidden: You do not have permission to view this order");
  }

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
    
    // Notify customer about order status update
    try {
      const { createNotification } = require("../notifications/notification.controller");
      await createNotification(
        order.userId,
        "Order Status Updated",
        `Your order #${order.id} status has been updated to ${status}.`,
        "ORDER"
      );
    } catch (error) {
      console.error("Failed to create notification for order status update:", error);
    }

    return sendResponse(res, 200, "order status updated", order);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};
export const cancelOrder = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  // @ts-ignore
  const { id: userId, role } = req.user;
  
  try {
    const order = await service.cancelOrder(id, userId, role === "ADMIN");
    return sendResponse(res, 200, "order cancelled and stock restored successfully", order);
  } catch (err: any) {
    const statusCode = err.message.includes("Unauthorized") ? 403 : 400;
    return sendResponse(res, statusCode, err.message);
  }
};
