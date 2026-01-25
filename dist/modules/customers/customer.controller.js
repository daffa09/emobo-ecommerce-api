"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomer = exports.listCustomers = void 0;
const prisma_1 = __importDefault(require("~/prisma"));
const response_1 = require("~/utils/response");
const listCustomers = async (_req, res) => {
    const customers = await prisma_1.default.user.findMany({
        where: { role: "CUSTOMER" },
        select: { id: true, email: true, name: true, createdAt: true },
    });
    return (0, response_1.sendResponse)(res, 200, "fetch data success", customers);
};
exports.listCustomers = listCustomers;
const getCustomer = async (req, res) => {
    const id = Number(req.params.id);
    const customer = await prisma_1.default.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
    if (!customer)
        return (0, response_1.sendResponse)(res, 404, "customer not found");
    return (0, response_1.sendResponse)(res, 200, "fetch data success", customer);
};
exports.getCustomer = getCustomer;
