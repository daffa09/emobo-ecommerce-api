import prisma from "../../prisma";

export const generateSalesReport = async (startDate?: Date, endDate?: Date) => {
  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const reports = await prisma.order.findMany({
    where: {
      ...where,
      status: { in: ["COMPLETED", "SHIPPED", "PROCESSING"] } // Asumsi status yang masuk report
    },
    include: {
      profile: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedReports = reports.map(r => {
    // Estimasi profit (misal total amount - modal, tapi karena tidak semua modal tercatat valid, kita set profit = total_grand untuk sekarang atau taxAmount)
    const cost = r.items.reduce((sum, item) => sum + (Number(item.product.buyPrice) * item.qty), 0);
    const profit = Number(r.total_grand) - cost;
    
    return {
      id: r.id,
      date: r.createdAt,
      customer: r.profile?.name || "Customer",
      totalAmount: Number(r.total_grand),
      profit: Math.round(profit > 0 ? profit : Number(r.appFee)),
      items: [], // Details dihilangkan agar konsisten
    };
  });

  const totalSales = formattedReports.reduce((sum, r) => sum + Number(r.totalAmount), 0);
  const totalProfit = formattedReports.reduce((sum, r) => sum + Number(r.profit), 0);
  const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
  const totalOrders = await prisma.order.count();

  return {
    orders: formattedReports,
    totalSales,
    totalProfit: Math.round(totalProfit),
    totalCustomers,
    totalOrders,
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
  };
};

export const generateIncomingGoodsReport = async (startDate?: Date, endDate?: Date) => {
  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const reports = await prisma.purchaseOrder.findMany({
    where,
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedReports = reports.map(r => {
    const totalCost = r.items.reduce((sum, item) => sum + (Number(item.product.buyPrice) * item.qty), 0);
    return {
      id: r.id,
      date: r.createdAt,
      receiptUrl: r.receiptUrl,
      notes: r.notes || '',
      totalQuantity: r.totalItemsOnReceipt,
      totalCost: totalCost,
    };
  });

  const totalQuantity = formattedReports.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalCost = formattedReports.reduce((sum, r) => sum + Number(r.totalCost), 0);

  return {
    purchases: formattedReports,
    totalQuantity,
    totalCost: Math.round(totalCost),
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
  };
};

