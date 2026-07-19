// src/modules/auth/auth.service.ts
import prisma from "../../prisma";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { add } from "date-fns";
import { randomUUID } from "node:crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../utils/email";

export const registerUser = async (email: string, password: string, name?: string) => {
  const hash = bcrypt.hashSync(password, 8);
  const verificationToken = randomUUID();

  const user = await prisma.user.create({
    data: { 
      email, 
      passwordHash: hash, 
      register: {
        create: {
          isEmailVerified: false,
          verificationToken,
        }
      },
      profile: {
        create: {
          name: name || "User",
          phone: ""
        }
      }
    },
    include: { profile: true, register: true }
  });

  // Notify admins when a new customer registers
  try {
    const { notifyAdmins } = require("../notifications/notification.controller");
    await notifyAdmins(
      "New Customer Joined",
      `A new customer, ${name || email}, has registered on the platform.`,
      "CUSTOMER"
    );
  } catch (error) {
    console.error("Failed to notify admins about new customer:", error);
  }

  // Send verification email
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }

  return user;
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ 
    where: { email },
    include: { profile: true, register: true }
  });
};

export const verifyEmailService = async (token: string) => {
  const register = await prisma.register.findUnique({ where: { verificationToken: token } });
  if (!register) throw new Error("Invalid or expired verification token");

  await prisma.register.update({
    where: { id: register.id },
    data: { 
      isEmailVerified: true, 
      verificationToken: null 
    },
  });

  return prisma.user.findUnique({ where: { id: register.userId } });
};

export const createSessionTokens = async (user: any) => {
  const payload = { id: user.id, email: user.email, role: user.role || "CUSTOMER" };
  const access_token = generateAccessToken(payload);
  const refresh_token = generateRefreshToken(payload);

  // store refresh token in DB with expiry
  const expiresAt = add(new Date(), { days: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7) });
  await prisma.refreshToken.create({
    data: {
      token: refresh_token,
      userId: user.id,
      expiresAt,
    },
  });

  return { access_token, refresh_token };
};

export const rotateRefreshToken = async (oldToken: string) => {
  try {
    // verify
    // @ts-ignore
    const payload = verifyRefreshToken(oldToken);
    // check in DB
    const dbToken = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
    if (!dbToken || dbToken.revoked) throw new Error("Invalid refresh token");

    // revoke old
    await prisma.refreshToken.update({ where: { token: oldToken }, data: { revoked: true } });

    // create new refresh token
    const user = await prisma.user.findUnique({ 
      where: { id: dbToken.userId },
      include: { profile: true }
    });
    if (!user) throw new Error("User not found");

    const { access_token, refresh_token } = await createSessionTokens(user);
    return { access_token, refresh_token };
  } catch (err) {
    throw err;
  }
};

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Email not found");

  const resetToken = randomUUID();
  const resetExpires = add(new Date(), { hours: 1 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    },
  });

  await sendPasswordResetEmail(email, resetToken);
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await prisma.user.findUnique({
    where: { resetPasswordToken: token },
  });

  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new Error("Reset token is invalid or has expired");
  }

  const hash = bcrypt.hashSync(newPassword, 8);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return user;
};
