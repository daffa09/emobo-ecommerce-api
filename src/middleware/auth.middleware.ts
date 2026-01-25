import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { sendResponse } from "../utils/response";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return sendResponse(res, 401, "Unauthorized: token required");

  const parts = authHeader.split(" ");
  if (parts.length !== 2) return sendResponse(res, 401, "Invalid auth header");

  const token = parts[1];
  try {
    const payload = verifyAccessToken(token);
    // attach user to req
    // @ts-ignore
    req.user = payload;
    next();
  } catch (err) {
    return sendResponse(res, 401, "Invalid or expired token");
  }
};
