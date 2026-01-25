"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_1 = require("~/utils/response");
const errorHandler = (err, _req, res, _next) => {
    console.error(err);
    const code = err.statusCode || 500;
    const message = err.message || "Internal server error";
    return (0, response_1.sendResponse)(res, code, message, []);
};
exports.errorHandler = errorHandler;
