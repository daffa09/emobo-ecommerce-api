import { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { asyncHandler } from "../../utils/async-handler";
import * as service from "./rajaongkir.service";

export const getProvinces = asyncHandler(async (req: Request, res: Response) => {
  const provinces = await service.getProvinces();
  return sendResponse(res, 200, "fetch provinces success", provinces);
});

export const getCities = asyncHandler(async (req: Request, res: Response) => {
  const { provinceId } = req.query;
  const cities = await service.getCities(provinceId as string);
  return sendResponse(res, 200, "fetch cities success", cities);
});

export const calculateCost = asyncHandler(async (req: Request, res: Response) => {
  const { destination, weight, courier } = req.body;
  // Origin is hardcoded to store location (e.g., Jakarta / id 151)
  const origin = "151";
  const costs = await service.getShippingCost({ origin, destination, weight, courier });
  return sendResponse(res, 200, "calculate cost success", costs);
});
