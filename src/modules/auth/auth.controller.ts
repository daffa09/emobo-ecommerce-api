// src/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { findUserByEmail, registerUser, createSessionTokens, rotateRefreshToken, verifyEmailService } from "./auth.service";
import bcrypt from "bcryptjs";
import prisma from "../../prisma";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const existing = await findUserByEmail(email);
  if (existing) return sendResponse(res, 400, "Email already registered");

  const user = await registerUser(email, password, name);
  return sendResponse(res, 201, "Silakan cek email kamu untuk mengonfirmasi akun.", { id: user.id, email: user.email });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return sendResponse(res, 400, "Invalid credentials");

  if (!user.isEmailVerified) {
    return sendResponse(res, 403, "Email not verified, please check your email");
  }

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

export const verifyUser = async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) return sendResponse(res, 400, "Token verification required");

  try {
    await verifyEmailService(token as string);
    return sendResponse(res, 200, "Konfirmasi email berhasil! Kamu sekarang bisa login.");
  } catch (error: any) {
    return sendResponse(res, 400, error.message || "Gagal verifikasi email");
  }
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

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return sendResponse(res, 400, "Email is required");

  try {
    const { requestPasswordReset } = await import("./auth.service");
    await requestPasswordReset(email);
    return sendResponse(res, 200, "Link reset password telah dikirim ke email kamu.");
  } catch (error: any) {
    // We don't want to reveal if a user exists or not for security, 
    // but in this specific app context, it's fine for now or we can genericize it.
    return sendResponse(res, 400, error.message || "Gagal memproses permintaan reset password");
  }
};

export const handleResetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) return sendResponse(res, 400, "Token and new password are required");

  try {
    const { resetPassword: resetPasswordService } = await import("./auth.service");
    await resetPasswordService(token, password);
    return sendResponse(res, 200, "Password kamu berhasil direset! Silakan login dengan password baru.");
  } catch (error: any) {
    return sendResponse(res, 400, error.message || "Gagal reset password");
  }
};
