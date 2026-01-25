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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrdersForUser = exports.getOrder = exports.createOrder = void 0;
const response_1 = require("~/utils/response");
const service = __importStar(require("./order.service"));
const createOrder = async (req, res) => {
    // @ts-ignore
    const userId = req.user.id;
    const { items, shippingAddr, phone, shippingCost, shippingService } = req.body;
    try {
        const order = await service.createOrder(userId, items, shippingAddr, phone, shippingCost, shippingService);
        return (0, response_1.sendResponse)(res, 201, "order created", order);
    }
    catch (err) {
        return (0, response_1.sendResponse)(res, 400, err.message);
    }
};
exports.createOrder = createOrder;
const getOrder = async (req, res) => {
    const id = Number(req.params.id);
    const order = await service.getOrderWithItems(id);
    if (!order)
        return (0, response_1.sendResponse)(res, 404, "order not found");
    return (0, response_1.sendResponse)(res, 200, "fetch data success", order);
};
exports.getOrder = getOrder;
const listOrdersForUser = async (req, res) => {
    // @ts-ignore
    const user = req.user;
    const orders = await service.listOrdersByUser(user.id);
    return (0, response_1.sendResponse)(res, 200, "fetch data success", orders);
};
exports.listOrdersForUser = listOrdersForUser;
