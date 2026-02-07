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

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const redirectUrl = `${frontendUrl}/customer/transactions/${orderId}`;

  const existing = await prisma.payment.findUnique({ where: { orderId } });
  if (existing && existing.snapToken) return existing;

  const parameter = {
    transaction_details: {
      order_id: `ORDER-${orderId}-${Date.now()}`,
      gross_amount: order.totalAmount,
    },
    // Both modern Snap callbacks and legacy redirect URL parameters for maximum compatibility
    callbacks: {
      finish: redirectUrl,
      error: redirectUrl,
      pending: redirectUrl,
    },
    finish_redirect_url: redirectUrl,
    error_redirect_url: redirectUrl,
    unfinish_redirect_url: redirectUrl,
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

  console.log("Midtrans Parameter:", JSON.stringify(parameter, null, 2));

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

// Helper function to handle status updates and DB changes
const updatePaymentAndOrder = async (statusResponse: any) => {
  const orderIdRaw = statusResponse.order_id;
  const transactionStatus = statusResponse.transaction_status;
  const fraudStatus = statusResponse.fraud_status;

  console.log(`Processing status update for ${orderIdRaw}. Status: ${transactionStatus}, Fraud: ${fraudStatus}`);

  // orderIdRaw is something like ORDER-123-1712345678
  const parts = orderIdRaw.split("-");
  const orderId = parseInt(parts[1]);

  if (isNaN(orderId)) {
    console.error(`Invalid orderId parsed from ${orderIdRaw}`);
    throw new Error("Invalid order ID format");
  }

  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) {
    console.error(`Payment not found for orderId: ${orderId}`);
    throw new Error("Payment not found");
  }

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

  console.log(`Determined payment status: ${paymentStatus}`);

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: paymentStatus === "PAID" ? "PAID" : paymentStatus === "FAILED" ? "FAILED" : "PENDING",
      paidAt: paymentStatus === "PAID" ? new Date() : null,
    },
  });

  if (paymentStatus === "PAID") {
    console.log(`Updating Order ${orderId} to PROCESSING`);
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PROCESSING" },
    });
  } else if (paymentStatus === "FAILED") {
    console.log(`Restoring stock for Order ${orderId} due to payment failure`);
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

export const handleMidtransNotification = async (notification: any) => {
  console.log("Handling Midtrans Notification (Webhook)");
  const statusResponse = await snap.transaction.notification(notification);
  return updatePaymentAndOrder(statusResponse);
};

export const verifyPayment = async (orderId: number) => {
  console.log(`Verifying payment for order ${orderId}...`);
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new Error("Payment not found");

  if (payment.status === "PAID") return payment;

  // If status is not PAID, check with Midtrans directly
  try {
    const statusResponse = await snap.transaction.status(payment.providerId);
    console.log(`Midtrans status response for ${payment.providerId}:`, JSON.stringify(statusResponse));
    return await updatePaymentAndOrder(statusResponse);
  } catch (err) {
    console.error("Midtrans status check error:", err);
    return payment;
  }
};
