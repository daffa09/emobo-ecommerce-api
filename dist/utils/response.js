"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, code, message, data = []) => {
    return res.status(code).json({
        code,
        status: code >= 200 && code < 300 ? "success" : "error",
        message,
        data,
    });
};
exports.sendResponse = sendResponse;
