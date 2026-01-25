"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const response_1 = require("~/utils/response");
const auth_service_1 = require("./auth.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("~/prisma"));
const register = async (req, res) => {
    const { email, password, name } = req.body;
    const existing = await (0, auth_service_1.findUserByEmail)(email);
    if (existing)
        return (0, response_1.sendResponse)(res, 400, "Email already registered");
    const user = await (0, auth_service_1.registerUser)(email, password, name);
    return (0, response_1.sendResponse)(res, 201, "register success", { id: user.id, email: user.email });
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await (0, auth_service_1.findUserByEmail)(email);
    if (!user)
        return (0, response_1.sendResponse)(res, 400, "Invalid credentials");
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return (0, response_1.sendResponse)(res, 400, "Invalid credentials");
    const { access_token, refresh_token } = await (0, auth_service_1.createSessionTokens)(user);
    res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return (0, response_1.sendResponse)(res, 200, "login success", {
        access_token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role
        }
    });
};
exports.login = login;
const refresh = async (req, res) => {
    const cookie = req.cookies?.refresh_token;
    if (!cookie)
        return (0, response_1.sendResponse)(res, 401, "Refresh token required");
    try {
        const { access_token, refresh_token } = await (0, auth_service_1.rotateRefreshToken)(cookie);
        // set new cookie
        res.cookie("refresh_token", refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return (0, response_1.sendResponse)(res, 200, "token refreshed", { access_token });
    }
    catch (err) {
        return (0, response_1.sendResponse)(res, 401, err.message || "Invalid refresh token");
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    const cookie = req.cookies?.refresh_token;
    if (cookie) {
        await prisma_1.default.refreshToken.updateMany({ where: { token: cookie }, data: { revoked: true } });
    }
    res.clearCookie("refresh_token");
    return (0, response_1.sendResponse)(res, 200, "logout success", []);
};
exports.logout = logout;
