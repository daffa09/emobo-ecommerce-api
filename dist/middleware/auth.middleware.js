"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("~/utils/jwt");
const response_1 = require("~/utils/response");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return (0, response_1.sendResponse)(res, 401, "Unauthorized: token required");
    const parts = authHeader.split(" ");
    if (parts.length !== 2)
        return (0, response_1.sendResponse)(res, 401, "Invalid auth header");
    const token = parts[1];
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        // attach user to req
        // @ts-ignore
        req.user = payload;
        next();
    }
    catch (err) {
        return (0, response_1.sendResponse)(res, 401, "Invalid or expired token");
    }
};
exports.authMiddleware = authMiddleware;
