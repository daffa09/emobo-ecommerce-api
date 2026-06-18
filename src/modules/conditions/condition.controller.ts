import { Request, Response } from "express";
import * as conditionService from "./condition.service";
import { sendResponse } from "../../utils/response";

export const getConditions = async (req: Request, res: Response) => {
  try {
    const conditions = await conditionService.getAllConditions();
    sendResponse(res, 200, "Conditions retrieved successfully", conditions);
  } catch (error: any) {
    sendResponse(res, 400, error.message);
  }
};

export const getCondition = async (req: Request, res: Response) => {
  try {
    const condition = await conditionService.getConditionById(req.params.id);
    sendResponse(res, 200, "Condition retrieved successfully", condition);
  } catch (error: any) {
    sendResponse(res, 404, error.message);
  }
};

export const createCondition = async (req: Request, res: Response) => {
  try {
    const condition = await conditionService.createCondition(req.body);
    sendResponse(res, 201, "Condition created successfully", condition);
  } catch (error: any) {
    sendResponse(res, 400, error.message);
  }
};

export const updateCondition = async (req: Request, res: Response) => {
  try {
    const condition = await conditionService.updateCondition(req.params.id, req.body);
    sendResponse(res, 200, "Condition updated successfully", condition);
  } catch (error: any) {
    sendResponse(res, 400, error.message);
  }
};

export const deleteCondition = async (req: Request, res: Response) => {
  try {
    await conditionService.deleteCondition(req.params.id);
    sendResponse(res, 200, "Condition deleted successfully", null);
  } catch (error: any) {
    sendResponse(res, 400, error.message);
  }
};
