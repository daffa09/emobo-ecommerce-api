"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotateRefreshToken = exports.createSessionTokens = exports.findUserByEmail = exports.registerUser = void 0;
// src/modules/auth/auth.service.ts
const prisma_1 = __importDefault(require("~/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("~/utils/jwt");
const date_fns_1 = require("date-fns");
const registerUser = async (email, password, name) => {
    const hash = bcryptjs_1.default.hashSync(password, 8);
    const user = await prisma_1.default.user.create({
        data: { email, passwordHash: hash, name, role: "CUSTOMER" },
    });
    return user;
};
exports.registerUser = registerUser;
const findUserByEmail = async (email) => {
    return prisma_1.default.user.findUnique({ where: { email } });
};
exports.findUserByEmail = findUserByEmail;
const createSessionTokens = async (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };
    const access_token = (0, jwt_1.generateAccessToken)(payload);
    const refresh_token = (0, jwt_1.generateRefreshToken)(payload);
    // store refresh token in DB with expiry
    const expiresAt = (0, date_fns_1.add)(new Date(), { days: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7) });
    await prisma_1.default.refreshToken.create({
        data: {
            token: refresh_token,
            userId: user.id,
            expiresAt,
        },
    });
    return { access_token, refresh_token };
};
exports.createSessionTokens = createSessionTokens;
const rotateRefreshToken = async (oldToken) => {
    try {
        // verify
        // @ts-ignore
        const payload = (0, jwt_1.verifyRefreshToken)(oldToken);
        // check in DB
        const dbToken = await prisma_1.default.refreshToken.findUnique({ where: { token: oldToken } });
        if (!dbToken || dbToken.revoked)
            throw new Error("Invalid refresh token");
        // revoke old
        await prisma_1.default.refreshToken.update({ where: { token: oldToken }, data: { revoked: true } });
        // create new refresh token
        const user = await prisma_1.default.user.findUnique({ where: { id: dbToken.userId } });
        if (!user)
            throw new Error("User not found");
        const { access_token, refresh_token } = await (0, exports.createSessionTokens)(user);
        return { access_token, refresh_token };
    }
    catch (err) {
        throw err;
    }
};
exports.rotateRefreshToken = rotateRefreshToken;
