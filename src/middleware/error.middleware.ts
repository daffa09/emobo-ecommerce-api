import { Request, Response, NextFunction } from "express";
import { sendResponse } from "~/utils/response";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const code = err.statusCode || 500;
  const message = err.message || "Internal server error";
  return sendResponse(res, code, message, []);
};
