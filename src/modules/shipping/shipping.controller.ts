import { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import * as service from "./rajaongkir.service";

export const getProvinces = async (req: Request, res: Response) => {
  try {
    const provinces = await service.getProvinces();
    return sendResponse(res, 200, "fetch provinces success", provinces);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

export const getCities = async (req: Request, res: Response) => {
  const { provinceId } = req.query;
  try {
    const cities = await service.getCities(provinceId as string);
    return sendResponse(res, 200, "fetch cities success", cities);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

export const calculateCost = async (req: Request, res: Response) => {
  const { destination, weight, courier } = req.body;
  // Origin is hardcoded to store location (e.g., Jakarta / id 151)
  const origin = "151"; 
  try {
    const costs = await service.getShippingCost({
      origin,
      destination,
      weight,
      courier,
    });
    return sendResponse(res, 200, "calculate cost success", costs);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};
