import { Request, Response, NextFunction } from "express";
import { sendResponse } from "~/utils/response";

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const user = req.user;
  if (!user) return sendResponse(res, 401, "Unauthorized");
  if (user.role !== "ADMIN") return sendResponse(res, 403, "Forbidden: admin only");
  next();
};
