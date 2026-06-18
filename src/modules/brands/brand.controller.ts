import { Request, Response } from "express";
import * as brandService from "./brand.service";
import { sendResponse } from "../../utils/response";

export const getBrands = async (req: Request, res: Response) => {
  try {
    const brands = await brandService.getAllBrands();
    sendResponse(res, 200, "Brands retrieved successfully", brands);
  } catch (error: any) {
    sendResponse(res, 400, error.message);
  }
};

export const getBrand = async (req: Request, res: Response) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    sendResponse(res, 200, "Brand retrieved successfully", brand);
  } catch (error: any) {
    sendResponse(res, 404, error.message);
  }
};

export const createBrand = async (req: Request, res: Response) => {
  try {
    const brand = await brandService.createBrand(req.body);
    sendResponse(res, 201, "Brand created successfully", brand);
  } catch (error: any) {
    sendResponse(res, 400, error.message);
  }
};

export const updateBrand = async (req: Request, res: Response) => {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    sendResponse(res, 200, "Brand updated successfully", brand);
  } catch (error: any) {
    sendResponse(res, 400, error.message);
  }
};

export const deleteBrand = async (req: Request, res: Response) => {
  try {
    await brandService.deleteBrand(req.params.id);
    sendResponse(res, 200, "Brand deleted successfully", null);
  } catch (error: any) {
    sendResponse(res, 400, error.message);
  }
};
