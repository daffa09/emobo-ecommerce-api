"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrdersByUser = exports.getOrderWithItems = exports.createOrder = void 0;
const prisma_1 = __importDefault(require("~/prisma"));
const createOrder = async (userId, items, shippingAddr, phone, shippingCost = 0, shippingService) => {
    // fetch products to get price & check stock
    const productIds = items.map((i) => i.productId);
    const products = await prisma_1.default.product.findMany({ where: { id: { in: productIds } } });
    // compute total and build order items
    let lineTotal = 0;
    const orderItemsData = items.map((i) => {
        const p = products.find((pp) => pp.id === i.productId);
        if (!p)
            throw new Error(`Product ${i.productId} not found`);
        if (p.stock < i.quantity)
            throw new Error(`Insufficient stock for product ${p.name}`);
        lineTotal += p.price * i.quantity;
        return {
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: p.price,
        };
    });
    const totalAmount = lineTotal + shippingCost;
    // create order and decrement stocks in transaction
    const order = await prisma_1.default.$transaction(async (tx) => {
        const o = await tx.order.create({
            data: {
                userId,
                totalAmount: totalAmount,
                shippingCost,
                shippingService,
                shippingAddr,
                phone,
                status: "PENDING",
            },
        });
        for (const oi of orderItemsData) {
            await tx.orderItem.create({
                data: {
                    orderId: o.id,
                    productId: oi.productId,
                    quantity: oi.quantity,
                    unitPrice: oi.unitPrice,
                },
            });
            await tx.product.update({
                where: { id: oi.productId },
                data: { stock: { decrement: oi.quantity } },
            });
        }
        return o;
    });
    return order;
};
exports.createOrder = createOrder;
const getOrderWithItems = async (id) => {
    return prisma_1.default.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
    });
};
exports.getOrderWithItems = getOrderWithItems;
const listOrdersByUser = async (userId) => {
    return prisma_1.default.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
    });
};
exports.listOrdersByUser = listOrdersByUser;
