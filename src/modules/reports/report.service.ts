import prisma from "../../prisma";

export const generateSalesReport = async (startDate?: Date, endDate?: Date) => {
  const reports = await prisma.salesReportView.findMany({
    where: {
      orderDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { orderDate: "desc" },
  });

  const totalSales = reports.reduce((sum, r) => sum + Number(r.totalAmount), 0);
  const totalProfit = reports.reduce((sum, r) => sum + Number(r.totalProfit), 0);

  return {
    orders: reports.map((r) => ({
      id: r.orderId,
      date: r.orderDate,
      customer: r.customerName || "Customer",
      totalAmount: Number(r.totalAmount),
      profit: Math.round(Number(r.totalProfit)),
      items: [], // Details dihilangkan agar report query menjadi lebih cepat menggunakan View
    })),
    totalSales,
    totalProfit: Math.round(totalProfit),
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
  };
};

export const generateIncomingGoodsReport = async (startDate?: Date, endDate?: Date) => {
  const reports = await prisma.incomingGoodsReportView.findMany({
    where: {
      poDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { poDate: 'desc' },
  });

  const totalQuantity = reports.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalCost = reports.reduce((sum, r) => sum + Number(r.totalCost), 0);

  return {
    purchases: reports.map((r) => ({
      id: r.poId,
      date: r.poDate,
      receiptUrl: r.receiptUrl,
      notes: r.notes || '',
      totalQuantity: r.totalQuantity,
      totalCost: Number(r.totalCost),
    })),
    totalQuantity,
    totalCost: Math.round(totalCost),
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
  };
};

