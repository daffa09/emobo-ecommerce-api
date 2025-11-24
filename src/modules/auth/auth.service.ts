// src/modules/auth/auth.service.ts
import prisma from "~/prisma";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "~/utils/jwt";
import { add } from "date-fns";

export const registerUser = async (email: string, password: string, name?: string) => {
  const hash = bcrypt.hashSync(password, 8);
  const user = await prisma.user.create({
    data: { email, passwordHash: hash, name, role: "CUSTOMER" },
  });
  return user;
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const createSessionTokens = async (user: any) => {
  const payload = { id: user.id, email: user.email, role: user.role };
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
    const user = await prisma.user.findUnique({ where: { id: dbToken.userId } });
    if (!user) throw new Error("User not found");

    const { access_token, refresh_token } = await createSessionTokens(user);
    return { access_token, refresh_token };
  } catch (err) {
    throw err;
  }
};
