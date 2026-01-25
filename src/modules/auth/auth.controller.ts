// src/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import { sendResponse } from "~/utils/response";
import { findUserByEmail, registerUser, createSessionTokens, rotateRefreshToken } from "./auth.service";
import bcrypt from "bcryptjs";
import prisma from "~/prisma";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const existing = await findUserByEmail(email);
  if (existing) return sendResponse(res, 400, "Email already registered");

  const user = await registerUser(email, password, name);
  return sendResponse(res, 201, "register success", { id: user.id, email: user.email });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return sendResponse(res, 400, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return sendResponse(res, 400, "Invalid credentials");

  const { access_token, refresh_token } = await createSessionTokens(user);

  res.cookie("refresh_token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendResponse(res, 200, "login success", { 
    access_token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
};

export const refresh = async (req: Request, res: Response) => {
  const cookie = req.cookies?.refresh_token;
  if (!cookie) return sendResponse(res, 401, "Refresh token required");

  try {
    const { access_token, refresh_token } = await rotateRefreshToken(cookie);

    // set new cookie
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendResponse(res, 200, "token refreshed", { access_token });
  } catch (err: any) {
    return sendResponse(res, 401, err.message || "Invalid refresh token");
  }
};

export const logout = async (req: Request, res: Response) => {
  const cookie = req.cookies?.refresh_token;
  if (cookie) {
    await prisma.refreshToken.updateMany({ where: { token: cookie }, data: { revoked: true } });
  }

  res.clearCookie("refresh_token");
  return sendResponse(res, 200, "logout success", []);
};
