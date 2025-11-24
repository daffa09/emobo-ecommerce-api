import { Request, Response } from "express";
import { sendResponse } from "~/utils/response";
import * as service from "./product.service";

export const getPublicProducts = async (_req: Request, res: Response) => {
  const data = await service.listPublicProducts();
  return sendResponse(res, 200, "fetch data success", data);
};

export const getProductsAdmin = async (_req: Request, res: Response) => {
  const data = await service.listProductsForAdmin();
  return sendResponse(res, 200, "fetch data success", data);
};

export const createProduct = async (req: Request, res: Response) => {
  const payload = req.body;
  const product = await service.createProduct(payload);
  return sendResponse(res, 201, "product created", product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const product = await service.updateProduct(id, req.body);
  return sendResponse(res, 200, "product updated", product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await service.deleteProduct(id);
  return sendResponse(res, 200, "product deleted", []);
};
