"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMidtransNotification = exports.createMidtransPayment = void 0;
const prisma_1 = __importDefault(require("~/prisma"));
const midtrans_client_1 = __importDefault(require("midtrans-client"));
const snap = new midtrans_client_1.default.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});
const createMidtransPayment = async (orderId) => {
    const order = await prisma_1.default.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            items: {
                include: { product: true },
            },
        },
    });
    if (!order)
        throw new Error("Order not found");
    const existing = await prisma_1.default.payment.findUnique({ where: { orderId } });
    if (existing && existing.snapToken)
        return existing;
    const parameter = {
        transaction_details: {
            order_id: `ORDER-${orderId}-${Date.now()}`,
            gross_amount: order.totalAmount,
        },
        customer_details: {
            first_name: order.user.name || "Customer",
            email: order.user.email,
            phone: order.phone,
        },
        item_details: order.items.map((item) => ({
            id: item.product.sku.toString(),
            price: item.unitPrice,
            quantity: item.quantity,
            name: item.product.name,
        })),
    };
    const transaction = await snap.createTransaction(parameter);
    const payment = await prisma_1.default.payment.upsert({
        where: { orderId },
        update: {
            provider: "midtrans",
            providerId: parameter.transaction_details.order_id,
            snapToken: transaction.token,
            redirectUrl: transaction.redirect_url,
            amount: order.totalAmount,
        },
        create: {
            orderId,
            provider: "midtrans",
            providerId: parameter.transaction_details.order_id,
            snapToken: transaction.token,
            redirectUrl: transaction.redirect_url,
            amount: order.totalAmount,
            status: "PENDING",
        },
    });
    return payment;
};
exports.createMidtransPayment = createMidtransPayment;
const handleMidtransNotification = async (notification) => {
    const statusResponse = await snap.transaction.notification(notification);
    const orderIdRaw = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    // orderIdRaw is something like ORDER-123-1712345678
    const parts = orderIdRaw.split("-");
    const orderId = parseInt(parts[1]);
    const payment = await prisma_1.default.payment.findUnique({ where: { orderId } });
    if (!payment)
        throw new Error("Payment not found");
    let paymentStatus = "PENDING";
    if (transactionStatus === "capture") {
        if (fraudStatus === "challenge") {
            paymentStatus = "PENDING";
        }
        else if (fraudStatus === "accept") {
            paymentStatus = "PAID";
        }
    }
    else if (transactionStatus === "settlement") {
        paymentStatus = "PAID";
    }
    else if (transactionStatus === "cancel" ||
        transactionStatus === "deny" ||
        transactionStatus === "expire") {
        paymentStatus = "FAILED";
    }
    else if (transactionStatus === "pending") {
        paymentStatus = "PENDING";
    }
    const updatedPayment = await prisma_1.default.payment.update({
        where: { id: payment.id },
        data: {
            status: paymentStatus === "PAID" ? "PAID" : paymentStatus === "FAILED" ? "FAILED" : "PENDING",
            paidAt: paymentStatus === "PAID" ? new Date() : null,
        },
    });
    if (paymentStatus === "PAID") {
        await prisma_1.default.order.update({
            where: { id: orderId },
            data: { status: "PROCESSING" },
        });
    }
    return updatedPayment;
};
exports.handleMidtransNotification = handleMidtransNotification;
