import jwt from "jsonwebtoken";

const accessSecret = process.env.ACCESS_TOKEN_SECRET!;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET!;

export const generateAccessToken = (payload: object) => {
  return jwt.sign(payload, accessSecret, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "30m" });
};

export const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, refreshSecret, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, accessSecret);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret);
};
