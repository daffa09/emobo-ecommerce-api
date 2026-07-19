import { Request, Response } from "express";
import * as conditionService from "./condition.service";
import { sendResponse } from "../../utils/response";
import { asyncHandler } from "../../utils/async-handler";

export const getConditions = asyncHandler(async (req: Request, res: Response) => {
  const conditions = await conditionService.getAllConditions();
  sendResponse(res, 200, "Conditions retrieved successfully", conditions);
});

export const getCondition = asyncHandler(async (req: Request, res: Response) => {
  const condition = await conditionService.getConditionById(req.params.id);
  sendResponse(res, 200, "Condition retrieved successfully", condition);
}, 404);

export const createCondition = asyncHandler(async (req: Request, res: Response) => {
  const condition = await conditionService.createCondition(req.body);
  sendResponse(res, 201, "Condition created successfully", condition);
});

export const updateCondition = asyncHandler(async (req: Request, res: Response) => {
  const condition = await conditionService.updateCondition(req.params.id, req.body);
  sendResponse(res, 200, "Condition updated successfully", condition);
});

export const deleteCondition = asyncHandler(async (req: Request, res: Response) => {
  await conditionService.deleteCondition(req.params.id);
  sendResponse(res, 200, "Condition deleted successfully", null);
});
