"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSalesReport = void 0;
const prisma_1 = __importDefault(require("~/prisma"));
const generateSalesReport = async (startDate, endDate) => {
    const orders = await prisma_1.default.order.findMany({
        where: {
            status: "COMPLETED",
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            user: true,
            items: {
                include: { product: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
        orders: orders.map((o) => ({
            id: o.id,
            date: o.createdAt,
            customer: o.user.name || "Customer",
            totalAmount: o.totalAmount,
            items: o.items.map((item) => ({
                productName: item.product.name,
                quantity: item.quantity,
                price: item.unitPrice,
            })),
        })),
        totalSales,
        period: {
            startDate: startDate || null,
            endDate: endDate || null,
        },
    };
};
exports.generateSalesReport = generateSalesReport;
