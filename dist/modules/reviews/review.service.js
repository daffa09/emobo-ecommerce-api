"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductReviews = exports.createReview = void 0;
const prisma_1 = __importDefault(require("~/prisma"));
const createReview = async (data) => {
    const order = await prisma_1.default.order.findUnique({
        where: { id: data.orderId },
    });
    if (!order || order.userId !== data.userId) {
        throw new Error("Invalid order or user");
    }
    if (order.status !== "COMPLETED") {
        throw new Error("Can only review completed orders");
    }
    const review = await prisma_1.default.review.create({
        data: {
            orderId: data.orderId,
            productId: data.productId,
            userId: data.userId,
            rating: data.rating,
            comment: data.comment,
        },
    });
    return review;
};
exports.createReview = createReview;
const getProductReviews = async (productId) => {
    return prisma_1.default.review.findMany({
        where: { productId },
        include: {
            user: {
                select: { name: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getProductReviews = getProductReviews;
