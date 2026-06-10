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
      biodata: true,
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const PPN_RATE = process.env.PPN_RATE ? parseInt(process.env.PPN_RATE) : 11;
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total_grand), 0);
  
  const totalProfit = Math.round(orders.reduce((sum, o) => {
    return sum + o.items.reduce((itemSum, item) => {
      const netSellingPrice = Number(item.unitPrice) / (1 + PPN_RATE / 100);
      const itemProfit = (netSellingPrice - (Number(item.product.buyPrice) || 0)) * item.quantity;
      return itemSum + itemProfit;
    }, 0);
  }, 0));

  return {
    orders: orders.map((o) => ({
      id: o.id,
      date: o.createdAt,
      customer: o.biodata?.name || "Customer",
      totalAmount: Number(o.total_grand),
      profit: Math.round(o.items.reduce((sum, item) => {
        const netSellingPrice = Number(item.unitPrice) / (1 + PPN_RATE / 100);
        return sum + (netSellingPrice - (Number(item.product.buyPrice) || 0)) * item.quantity;
      }, 0)),
      items: o.items.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.unitPrice),
        buyPrice: Number(item.product.buyPrice),
      })),
    })),
    totalSales,
    totalProfit,
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
  };
};
