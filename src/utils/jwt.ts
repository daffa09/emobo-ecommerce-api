import jwt from "jsonwebtoken";

const accessSecret = process.env.ACCESS_TOKEN_SECRET!;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET!;

export const generateAccessToken = (payload: object) => {
  const expiresIn = (process.env.ACCESS_TOKEN_EXPIRES || "30m") as string;
  return jwt.sign(payload, accessSecret, { expiresIn } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: object) => {
  const expiresIn = (process.env.REFRESH_TOKEN_EXPIRES || "7d") as string;
  return jwt.sign(payload, refreshSecret, { expiresIn } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, accessSecret);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret);
};
