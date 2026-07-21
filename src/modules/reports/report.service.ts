import { Prisma } from "@prisma/client";
import prisma from "../../prisma";

// endDate dari input <date> = tengah malam, jadi transaksi di hari itu
// (jam > 00:00) ikut kefilter. Dorong ke akhir hari biar inklusif.
const endOfDay = (d: Date) => {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
};

// Filter rentang tanggal yang dipakai kelima laporan.
const dateWhere = (startDate?: Date, endDate?: Date) =>
  startDate || endDate
    ? {
        createdAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endOfDay(endDate) }),
        },
      }
    : {};

const period = (startDate?: Date, endDate?: Date) => ({
  startDate: startDate || null,
  endDate: endDate || null,
});

export const generateSalesReport = async (startDate?: Date, endDate?: Date) => {
  const where = dateWhere(startDate, endDate);

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
    period: period(startDate, endDate),
  };
};

export const generateIncomingGoodsReport = async (startDate?: Date, endDate?: Date) => {
  const where = dateWhere(startDate, endDate);

  const reports = await prisma.inboundTransaction.findMany({
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
    period: period(startDate, endDate),
  };
};

export const generateOutboundGoodsReport = async (startDate?: Date, endDate?: Date) => {
  const where = dateWhere(startDate, endDate);

  const reports = await prisma.order.findMany({
    where: {
      ...where,
      status: { in: ["SHIPPED", "COMPLETED"] }
    },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedReports = reports.flatMap(r => 
    r.items.map(item => ({
      orderId: r.id,
      date: r.createdAt,
      productName: item.product.name,
      sku: item.product.sku,
      qtyOut: item.qty,
      totalPrice: Number(item.total_price),
    }))
  );

  const totalQtyOut = formattedReports.reduce((sum, r) => sum + r.qtyOut, 0);

  return {
    outbound: formattedReports,
    totalQtyOut,
    period: period(startDate, endDate),
  };
};

export const generateCurrentStockReport = async (startDate?: Date, endDate?: Date) => {
  const whereInbound: Prisma.InboundTransactionWhereInput = dateWhere(startDate, endDate);
  const whereOutbound: Prisma.OrderWhereInput = {
    status: { in: ["SHIPPED", "COMPLETED"] },
    ...dateWhere(startDate, endDate),
  };

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      inboundItems: {
        where: { inboundTransaction: whereInbound }
      },
      orderItems: {
        where: { order: whereOutbound }
      },
      monitorStock: true
    }
  });

  const formattedReports = products.map(p => {
    const qtyIn = p.inboundItems.reduce((sum, item) => sum + item.qty, 0);
    const qtyOut = p.orderItems.reduce((sum, item) => sum + item.qty, 0);
    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      qtyIn,
      qtyOut,
      currentStock: p.monitorStock?.currentStock || 0
    };
  });

  return {
    stock: formattedReports,
    period: period(startDate, endDate),
  };
};

export const generateShippingReport = async (startDate?: Date, endDate?: Date) => {
  const where: Prisma.OrderWhereInput = {
    status: { in: ["SHIPPED", "COMPLETED"] },
    ...dateWhere(startDate, endDate),
  };

  const orders = await prisma.order.findMany({
    where,
    select: { shippingService: true, shippingCost: true }
  });

  const agg: Record<string, { count: number; totalCost: number }> = {};
  orders.forEach(o => {
    const srv = o.shippingService || "Unknown";
    if (!agg[srv]) agg[srv] = { count: 0, totalCost: 0 };
    agg[srv].count += 1;
    agg[srv].totalCost += Number(o.shippingCost);
  });

  const formattedReports = Object.keys(agg).map(k => ({
    shippingService: k,
    transactionCount: agg[k].count,
    totalCost: agg[k].totalCost,
  }));

  return {
    shipping: formattedReports,
    period: period(startDate, endDate),
  };
};

export const generateSalesByBrandYearly = async (year: number) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["COMPLETED", "SHIPPED", "PROCESSING"] }
    },
    include: {
      items: {
        include: {
          product: {
            include: { brand: true }
          }
        }
      }
    }
  });

  // brand -> month (1-12) -> set of order ids, so an order with 2 items of the
  // same brand still counts as one transaction
  const aggOrders: Record<string, Record<number, Set<string>>> = {};
  orders.forEach(o => {
    const month = o.createdAt.getMonth() + 1;
    o.items.forEach(item => {
      const brandName = item.product.brand.name;
      if (!aggOrders[brandName]) aggOrders[brandName] = {};
      if (!aggOrders[brandName][month]) aggOrders[brandName][month] = new Set();
      aggOrders[brandName][month].add(o.id);
    });
  });

  const finalAgg: Record<string, Record<number, number>> = {};
  Object.keys(aggOrders).forEach(brand => {
    finalAgg[brand] = {};
    Object.keys(aggOrders[brand]).forEach(month => {
      finalAgg[brand][Number(month)] = aggOrders[brand][Number(month)].size;
    });
  });

  return finalAgg;
};
