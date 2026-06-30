import prisma from "../../prisma";
import { getLatestStockMap } from "../products/product.service";

export const createOrder = async (
  userId: string,
  items: { productId: string; qty: number }[],
  shippingAddr: any,
  phone: string,
  shippingCost: number = 0,
  shippingService?: string,
  estimatedDays?: number
) => {
  const profile = await prisma.user.findUnique({ where: { id: userId } });
  if (!profile) throw new Error("User not found");
  if (!profile.profileId) throw new Error("No profile"); const profileId = profile.profileId;

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ 
    where: { 
      id: { in: productIds },
      deletedAt: null
    } 
  });

  const stockMap = await getLatestStockMap(productIds);

  let lineTotal = 0;
  const orderItemsData = items.map((i: any) => {
    const p = products.find((pp: any) => pp.id === i.productId);
    if (!p) throw new Error(`Product ${i.productId} not found`);
    
    const qty = Number(i.qty || i.quantity || 1);
    const currentStock = stockMap[p.id] || 0;
    if (currentStock < qty) throw new Error(`Insufficient stock for product ${p.name}`);
    
    const priceNum = Number(p.price?.toString() || "0");
    lineTotal += priceNum * qty;
    
    return {
      productId: i.productId,
      qty: qty,
      unitPrice: priceNum,
    };
  });

  const PPN_RATE = process.env.PPN_RATE ? parseInt(process.env.PPN_RATE) : 11;
  const APP_FEE = process.env.APP_FEE ? parseInt(process.env.APP_FEE) : 1000;

  const taxAmount = Math.round(lineTotal - (lineTotal / (1 + PPN_RATE / 100)));
  const appFee = APP_FEE;
  const totalAmount = lineTotal + shippingCost + appFee;

  const order = await prisma.$transaction(async (tx: any) => {
    const today = new Date();
    const dateStr = today.getDate().toString().padStart(2, '0') + 
                    (today.getMonth() + 1).toString().padStart(2, '0') + 
                    today.getFullYear();
    const prefix = `TR${dateStr}-`;
    
    const lastOrder = await tx.order.findFirst({
      where: { id: { startsWith: prefix } },
      orderBy: { id: 'desc' }
    });
    
    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.id.split('-')[1]);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    
    const customId = `${prefix}${seq.toString().padStart(4, '0')}`;

    const o = await tx.order.create({
      data: {
        id: customId,
        profile: { connect: { id: profileId } },
        total_grand: totalAmount,
        shippingCost,
        shippingService,
        shippingAddr,
        phone,
        status: "PENDING",
        estimatedDays: estimatedDays || null,
        taxAmount,
        appFee,
      },
    });

    for (const oi of orderItemsData) {
      await tx.orderItem.create({
        data: {
          orderId: o.id,
          productId: oi.productId,
          qty: oi.qty,
          unitPrice: oi.unitPrice,
          total_price: oi.unitPrice * oi.qty,
        },
      });
      await tx.monitorStock.update({
        where: { productId: oi.productId },
        data: { currentStock: { decrement: oi.qty } }
      });
    }

    return o;
  });

  return order;
};

export const getOrderWithItems = async (id: string) => {
  return prisma.order.findUnique({
    where: { id },
    include: { 
      items: { include: { product: true } },
      payment: true,
      reviews: true,
      profile: { include: { user: { select: { id: true } } } }
    },
  });
};

export const listOrdersByUser = async (userId: string, params?: { search?: string; limit?: number; offset?: number }) => {
  const profile = await prisma.user.findUnique({ where: { id: userId } });
  if (!profile || !profile.profileId) return { orders: [], total: 0 };

  const where: any = { profileId: profile.profileId };

  if (params?.search) {
    where.items = {
      some: {
        product: {
          name: {
            contains: params.search,
            mode: 'insensitive'
          }
        }
      }
    };
  }

  const limit = params?.limit || 10;
  const offset = params?.offset || 0;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.order.count({ where })
  ]);

  return { orders, total };
};

export const listAllOrders = async () => {
  return prisma.order.findMany({
    include: { 
      items: { include: { product: true } },
      profile: { select: { id: true, name: true, phone: true, user: { select: { email: true } } } },
      payment: true
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateStatus = async (id: string, status: any, trackingNo?: string) => {
  const data: any = { status };
  if (trackingNo !== undefined) data.trackingNo = trackingNo;
  if (status === "SHIPPED") data.shippedAt = new Date();
  return prisma.order.update({
    where: { id },
    data,
    include: { profile: { include: { user: true } } }
  });
};

export const confirmOrderReceived = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { profile: { include: { user: true } } } });
  if (!order) throw new Error("Order not found");
  if ((order.profile?.user?.id || "") !== userId) throw new Error("Unauthorized");
  if (order.status !== "SHIPPED") throw new Error("Order is not in SHIPPED status");

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED" },
  });
};

export const cancelOrder = async (orderId: string, userId: string, isAdmin: boolean = false) => {
  return await prisma.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, profile: { include: { user: true } } }
    });

    if (!order) throw new Error("Order not found");
    
    if (!isAdmin && (order.profile?.user?.id || "") !== userId) {
      throw new Error("Unauthorized to cancel this order");
    }

    if (order.status !== "PENDING") {
      throw new Error(`Cannot cancel order in ${order.status} status`);
    }

    for (const item of order.items) {
      await tx.monitorStock.update({
        where: { productId: item.productId },
        data: { currentStock: { increment: item.qty } }
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });

    await tx.payment.updateMany({
      where: { orderId: orderId },
      data: { status: "FAILED" }
    });

    return updatedOrder;
  });
};

export const processDeliveryNotificationsAndAutoComplete = async (
  createNotificationFn: (userId: string, title: string, message: string, type: string) => Promise<any>
) => {
  const now = new Date();

  const ordersToNotify = await prisma.order.findMany({
    where: {
      status: "SHIPPED",
      shippedAt: { not: null },
      estimatedDays: { not: null },
      deliveryNotifiedAt: null,
    },
    include: { profile: { include: { user: true } } }
  });

  for (const order of ordersToNotify) {
    if (!order.shippedAt || !order.estimatedDays) continue;
    const estimatedDelivery = new Date(order.shippedAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + order.estimatedDays);

    if (now >= estimatedDelivery) {
      await createNotificationFn(
        (order.profile?.user?.id || ""),
        "Konfirmasi Penerimaan Pesanan",
        `Pesanan #${order.id} Anda diperkirakan sudah tiba! Silakan konfirmasi penerimaan pesanan sebelum 3 hari ke depan. Jika tidak dikonfirmasi, sistem akan otomatis menyelesaikan pesanan Anda.`,
        "ORDER"
      );
      await prisma.order.update({
        where: { id: order.id },
        data: { deliveryNotifiedAt: now },
      });
    }
  }

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const ordersToAutoComplete = await prisma.order.findMany({
    where: {
      status: "SHIPPED",
      deliveryNotifiedAt: { not: null },
    },
    include: { profile: { include: { user: true } } }
  });

  for (const order of ordersToAutoComplete) {
    if (!order.deliveryNotifiedAt) continue;
    const autoCompleteAt = new Date(order.deliveryNotifiedAt.getTime() + THREE_DAYS_MS);

    if (now >= autoCompleteAt) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED" },
      });
      await createNotificationFn(
        (order.profile?.user?.id || ""),
        "Pesanan Diselesaikan Otomatis",
        `Pesanan #${order.id} Anda telah diselesaikan secara otomatis karena tidak ada konfirmasi penerimaan dalam 3 hari.`,
        "ORDER"
      );
    }
  }
};


