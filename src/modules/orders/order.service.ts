import prisma from "../../prisma";

export const createOrder = async (
  userId: number,
  items: { productId: number; quantity: number }[],
  shippingAddr: any,
  phone: string,
  shippingCost: number = 0,
  shippingService?: string,
  estimatedDays?: number
) => {
  // fetch products to get price & check stock
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ 
    where: { 
      id: { in: productIds },
      deletedAt: null
    } 
  });
  // compute total and build order items
  let lineTotal = 0;
  const orderItemsData = items.map((i) => {
    const p = products.find((pp: any) => pp.id === i.productId);
    if (!p) throw new Error(`Product ${i.productId} not found`);
    if (p.stock < i.quantity) throw new Error(`Insufficient stock for product ${p.name}`);
    lineTotal += p.price * i.quantity;
    return {
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: p.price,
    };
  });

  const totalAmount = lineTotal + shippingCost;

  // create order and decrement stocks in transaction
  const order = await prisma.$transaction(async (tx: any) => {
    const o = await tx.order.create({
      data: {
        userId,
        totalAmount: totalAmount,
        shippingCost,
        shippingService,
        shippingAddr,
        phone,
        status: "PENDING",
        estimatedDays: estimatedDays || null,
      },
    });

    for (const oi of orderItemsData) {
      await tx.orderItem.create({
        data: {
          orderId: o.id,
          productId: oi.productId,
          quantity: oi.quantity,
          unitPrice: oi.unitPrice,
        },
      });
      await tx.product.update({
        where: { id: oi.productId },
        data: { stock: { decrement: oi.quantity } },
      });
    }

    return o;
  });

  return order;
};

export const getOrderWithItems = async (id: number) => {
  return prisma.order.findUnique({
    where: { id },
    include: { 
      items: { include: { product: true } },
      payment: true
    },
  });
};

export const listOrdersByUser = async (userId: number) => {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
};

export const listAllOrders = async () => {
  return prisma.order.findMany({
    include: { 
      items: { include: { product: true } },
      user: { select: { id: true, name: true, email: true } },
      payment: true
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateStatus = async (id: number, status: any, trackingNo?: string) => {
  const data: any = { status };
  if (trackingNo !== undefined) data.trackingNo = trackingNo;
  // When admin marks as SHIPPED, record the timestamp
  if (status === "SHIPPED") data.shippedAt = new Date();
  return prisma.order.update({
    where: { id },
    data,
  });
};

export const confirmOrderReceived = async (orderId: number, userId: number) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.userId !== userId) throw new Error("Unauthorized");
  if (order.status !== "SHIPPED") throw new Error("Order is not in SHIPPED status");

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED" },
  });
};

export const cancelOrder = async (orderId: number, userId: number, isAdmin: boolean = false) => {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Get order with items and current status
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) throw new Error("Order not found");
    
    // 2. Ownership check
    if (!isAdmin && order.userId !== userId) {
      throw new Error("Unauthorized to cancel this order");
    }

    // 3. Status check - only PENDING can be cancelled
    if (order.status !== "PENDING") {
      throw new Error(`Cannot cancel order in ${order.status} status`);
    }

    // 4. Restore stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });
    }

    // 5. Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });

    // 6. Update payment status if exists
    await tx.payment.updateMany({
      where: { orderId: orderId },
      data: { status: "FAILED" }
    });

    return updatedOrder;
  });
};

/**
 * Scheduled job logic:
 * 1. Find SHIPPED orders where (shippedAt + estimatedDays) <= now AND deliveryNotifiedAt is null
 *    => Send "please confirm" notification and set deliveryNotifiedAt = now
 * 2. Find SHIPPED orders where deliveryNotifiedAt is not null AND (deliveryNotifiedAt + 3 days) <= now
 *    => Auto-complete the order
 */
export const processDeliveryNotificationsAndAutoComplete = async (
  createNotificationFn: (userId: number, title: string, message: string, type: string) => Promise<any>
) => {
  const now = new Date();

  // Step 1: Send notification to orders that have passed their estimated delivery date
  const ordersToNotify = await prisma.order.findMany({
    where: {
      status: "SHIPPED",
      shippedAt: { not: null },
      estimatedDays: { not: null },
      deliveryNotifiedAt: null,
    },
  });

  for (const order of ordersToNotify) {
    if (!order.shippedAt || !order.estimatedDays) continue;
    const estimatedDelivery = new Date(order.shippedAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + order.estimatedDays);

    if (now >= estimatedDelivery) {
      // Send notification
      await createNotificationFn(
        order.userId,
        "Konfirmasi Penerimaan Pesanan",
        `Pesanan #${order.id} Anda diperkirakan sudah tiba! Silakan konfirmasi penerimaan pesanan sebelum 3 hari ke depan. Jika tidak dikonfirmasi, sistem akan otomatis menyelesaikan pesanan Anda.`,
        "ORDER"
      );
      // Mark notification as sent
      await prisma.order.update({
        where: { id: order.id },
        data: { deliveryNotifiedAt: now },
      });
    }
  }

  // Step 2: Auto-complete orders that have been notified and 3 days have passed
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const ordersToAutoComplete = await prisma.order.findMany({
    where: {
      status: "SHIPPED",
      deliveryNotifiedAt: { not: null },
    },
  });

  for (const order of ordersToAutoComplete) {
    if (!order.deliveryNotifiedAt) continue;
    const autoCompleteAt = new Date(order.deliveryNotifiedAt.getTime() + THREE_DAYS_MS);

    if (now >= autoCompleteAt) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED" },
      });
      // Notify customer about auto-completion
      await createNotificationFn(
        order.userId,
        "Pesanan Diselesaikan Otomatis",
        `Pesanan #${order.id} Anda telah diselesaikan secara otomatis karena tidak ada konfirmasi penerimaan dalam 3 hari.`,
        "ORDER"
      );
    }
  }
};
