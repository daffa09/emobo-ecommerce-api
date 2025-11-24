import prisma from "~/prisma";

export const createOrder = async (userId: number, items: { productId: number; quantity: number }[], shippingAddr: any, phone: string) => {
  // fetch products to get price & check stock
  const productIds = items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  // compute total and build order items
  let total = 0;
  const orderItemsData = items.map(i => {
    const p = products.find((pp: any) => pp.id === i.productId);
    if (!p) throw new Error(`Product ${i.productId} not found`);
    if (p.stock < i.quantity) throw new Error(`Insufficient stock for product ${p.name}`);
    total += p.price * i.quantity;
    return {
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: p.price,
    };
  });

  // create order and decrement stocks in transaction
  const order = await prisma.$transaction(async (tx: any) => {
    const o = await tx.order.create({
      data: {
        userId,
        totalAmount: total,
        shippingAddr,
        phone,
        status: "PENDING",
      },
    });

    for (const oi of orderItemsData) {
      await tx.orderItem.create({
        data: { orderId: o.id, productId: oi.productId, quantity: oi.quantity, unitPrice: oi.unitPrice },
      });
      await tx.product.update({ where: { id: oi.productId }, data: { stock: { decrement: oi.quantity } } });
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
