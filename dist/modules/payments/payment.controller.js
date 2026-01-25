"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStatus = exports.webhook = exports.createPayment = void 0;
const response_1 = require("~/utils/response");
const service = __importStar(require("./payment.service"));
const prisma_1 = __importDefault(require("~/prisma"));
const createPayment = async (req, res) => {
    const orderId = Number(req.params.orderId);
    try {
        const payment = await service.createMidtransPayment(orderId);
        return (0, response_1.sendResponse)(res, 201, "payment created", payment);
    }
    catch (err) {
        console.error("Midtrans create error:", err);
        return (0, response_1.sendResponse)(res, 400, err.message);
    }
};
exports.createPayment = createPayment;
// webhook endpoint for Midtrans
const webhook = async (req, res) => {
    try {
        await service.handleMidtransNotification(req.body);
        return res.status(200).send("OK");
    }
    catch (err) {
        console.error("Midtrans webhook error:", err);
        return res.status(400).send("ERROR");
    }
};
exports.webhook = webhook;
const getPaymentStatus = async (req, res) => {
    const orderId = Number(req.params.orderId);
    const payment = await prisma_1.default.payment.findUnique({ where: { orderId } });
    if (!payment)
        return (0, response_1.sendResponse)(res, 404, "payment not found");
    return (0, response_1.sendResponse)(res, 200, "fetch data success", payment);
};
exports.getPaymentStatus = getPaymentStatus;
