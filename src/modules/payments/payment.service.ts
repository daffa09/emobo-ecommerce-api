import prisma from "../../prisma";
import midtransClient from "midtrans-client";

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

export const createMidtransPayment = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  const existing = await prisma.payment.findUnique({ where: { orderId } });
  if (existing && existing.snapToken) return existing;

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
    item_details: [
      ...order.items.map((item) => ({
        id: item.product.sku.toString(),
        price: item.unitPrice,
        quantity: item.quantity,
        name: item.product.name.substring(0, 50), // Midtrans max 50 chars
      })),
      // Add shipping cost as separate item
      ...(order.shippingCost > 0 ? [{
        id: "SHIPPING",
        price: order.shippingCost,
        quantity: 1,
        name: order.shippingService || "Biaya Pengiriman",
      }] : []),
    ],
  };

  const transaction = await snap.createTransaction(parameter);

  const payment = await prisma.payment.upsert({
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

export const handleMidtransNotification = async (notification: any) => {
  const statusResponse = await snap.transaction.notification(notification);
  const orderIdRaw = statusResponse.order_id;
  const transactionStatus = statusResponse.transaction_status;
  const fraudStatus = statusResponse.fraud_status;

  // orderIdRaw is something like ORDER-123-1712345678
  const parts = orderIdRaw.split("-");
  const orderId = parseInt(parts[1]);

  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new Error("Payment not found");

  let paymentStatus: "PAID" | "FAILED" | "PENDING" = "PENDING";

  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") {
      paymentStatus = "PENDING";
    } else if (fraudStatus === "accept") {
      paymentStatus = "PAID";
    }
  } else if (transactionStatus === "settlement") {
    paymentStatus = "PAID";
  } else if (
    transactionStatus === "cancel" ||
    transactionStatus === "deny" ||
    transactionStatus === "expire"
  ) {
    paymentStatus = "FAILED";
  } else if (transactionStatus === "pending") {
    paymentStatus = "PENDING";
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: paymentStatus === "PAID" ? "PAID" : paymentStatus === "FAILED" ? "FAILED" : "PENDING",
      paidAt: paymentStatus === "PAID" ? new Date() : null,
    },
  });

  if (paymentStatus === "PAID") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PROCESSING" },
    });
  } else if (paymentStatus === "FAILED") {
    // Restore stock if payment failed/expired/cancelled
    await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      // Only restore if it was still PENDING to avoid double restoration
      if (order && order.status === "PENDING") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" }
        });
      }
    });
  }

  return updatedPayment;
};
