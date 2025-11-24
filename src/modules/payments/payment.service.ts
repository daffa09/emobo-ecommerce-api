import prisma from "~/prisma";

export const createMockQRPayment = async (orderId: number) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  // check if payment exists
  const existing = await prisma.payment.findUnique({ where: { orderId } });
  if (existing) return existing;

  // create payment
  const payment = await prisma.payment.create({
    data: {
      orderId,
      provider: "mock",
      providerId: `MOCK-${Date.now()}`,
      amount: order.totalAmount,
      qrisCode: `QR-MOCK-${orderId}-${Date.now()}`,
      status: "PENDING",
    },
  });

  return payment;
};

export const handleMockProviderNotification = async (providerId: string) => {
  const payment = await prisma.payment.findFirst({ where: { providerId } });
  if (!payment) throw new Error("Payment not found");

  if (payment.status === "PAID") return payment;

  // update payment
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: new Date() },
  });

  // update order status
  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: "PROCESSING" },
  });

  return updated;
};
