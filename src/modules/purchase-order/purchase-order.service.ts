import prisma from "../../prisma";

export interface PurchaseOrderItemData {
  productId: string;
  quantity: number;
}

export interface PurchaseOrderData {
  receiptUrl: string;
  totalItemsOnReceipt: number;
  notes?: string;
  items: PurchaseOrderItemData[];
}

export const createPurchaseOrder = async (data: PurchaseOrderData) => {
  return prisma.$transaction(async (tx) => {
    // 1. Create Purchase Order with nested items
    const po = await tx.purchaseOrder.create({
      data: {
        receiptUrl: data.receiptUrl,
        totalItemsOnReceipt: data.totalItemsOnReceipt,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 2. Update Product Stock for each item
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    return po;
  });
};

export const listPurchaseOrders = async () => {
  return prisma.purchaseOrder.findMany({
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              brand: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getPurchaseOrderById = async (id: string) => {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};
