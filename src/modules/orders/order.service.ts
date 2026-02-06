import prisma from "../../prisma";

export const createOrder = async (
  userId: number,
  items: { productId: number; quantity: number }[],
  shippingAddr: any,
  phone: string,
  shippingCost: number = 0,
  shippingService?: string
) => {
  // fetch products to get price & check stock
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
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
    include: { items: { include: { product: true } } },
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

export const updateStatus = async (id: number, status: any) => {
  return prisma.order.update({
    where: { id },
    data: { status },
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
