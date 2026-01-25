"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopSellingProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.listProductsForAdmin = exports.listPublicProducts = void 0;
const prisma_1 = __importDefault(require("~/prisma"));
const listPublicProducts = async () => {
    return prisma_1.default.product.findMany();
};
exports.listPublicProducts = listPublicProducts;
const listProductsForAdmin = async () => {
    return prisma_1.default.product.findMany();
};
exports.listProductsForAdmin = listProductsForAdmin;
const createProduct = async (data) => {
    return prisma_1.default.product.create({ data });
};
exports.createProduct = createProduct;
const updateProduct = async (id, data) => {
    return prisma_1.default.product.update({ where: { id }, data });
};
exports.updateProduct = updateProduct;
const deleteProduct = async (id) => {
    return prisma_1.default.product.delete({ where: { id } });
};
exports.deleteProduct = deleteProduct;
const getTopSellingProducts = async (limit = 5) => {
    const result = await prisma_1.default.orderItem.groupBy({
        by: ["productId"],
        _sum: {
            quantity: true,
        },
        orderBy: {
            _sum: {
                quantity: "desc",
            },
        },
        take: limit,
    });
    const productIds = result.map((r) => r.productId);
    const products = await prisma_1.default.product.findMany({
        where: {
            id: { in: productIds },
        },
    });
    return result.map((r) => {
        const p = products.find((pp) => pp.id === r.productId);
        return {
            ...p,
            totalSold: r._sum.quantity,
        };
    });
};
exports.getTopSellingProducts = getTopSellingProducts;
