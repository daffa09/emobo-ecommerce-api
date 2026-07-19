import { Request, Response } from "express";
import * as brandService from "./brand.service";
import { sendResponse } from "../../utils/response";
import { asyncHandler } from "../../utils/async-handler";

export const getBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await brandService.getAllBrands();
  sendResponse(res, 200, "Brands retrieved successfully", brands);
});

export const getBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await brandService.getBrandById(req.params.id);
  sendResponse(res, 200, "Brand retrieved successfully", brand);
}, 404);

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await brandService.createBrand(req.body);
  sendResponse(res, 201, "Brand created successfully", brand);
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await brandService.updateBrand(req.params.id, req.body);
  sendResponse(res, 200, "Brand updated successfully", brand);
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  await brandService.deleteBrand(req.params.id);
  sendResponse(res, 200, "Brand deleted successfully", null);
});
