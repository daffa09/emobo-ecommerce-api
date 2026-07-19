import { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

/**
 * Bungkus handler async supaya error-nya diteruskan ke errorHandler,
 * tanpa perlu try/catch di setiap controller.
 *
 * `fallbackCode` dipakai kalau error yang dilempar service tidak membawa
 * statusCode sendiri — service di proyek ini melempar `new Error(...)` polos,
 * jadi tanpa ini semua error akan jadi 500.
 */
export const asyncHandler =
  (fn: Handler, fallbackCode = 400) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      if (!err.statusCode) err.statusCode = fallbackCode;
      next(err);
    }
  };
