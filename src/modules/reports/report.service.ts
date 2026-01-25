import prisma from "../../prisma";

export const generateSalesReport = async (startDate?: Date, endDate?: Date) => {
  const orders = await prisma.order.findMany({
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
