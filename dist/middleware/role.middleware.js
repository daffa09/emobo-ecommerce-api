"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = void 0;
const response_1 = require("~/utils/response");
const adminOnly = (req, res, next) => {
    // @ts-ignore
    const user = req.user;
    if (!user)
        return (0, response_1.sendResponse)(res, 401, "Unauthorized");
    if (user.role !== "ADMIN")
        return (0, response_1.sendResponse)(res, 403, "Forbidden: admin only");
    next();
};
exports.adminOnly = adminOnly;
