import { Response } from "express";

export const sendResponse = (res: Response, code: number, message: string, data: any = []) => {
  return res.status(code).json({
    code,
    status: code >= 200 && code < 300 ? "success" : "error",
    message,
    data,
  });
};
