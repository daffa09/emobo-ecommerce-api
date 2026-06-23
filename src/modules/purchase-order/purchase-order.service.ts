import prisma from "../../prisma";

export interface PurchaseOrderItemData {
  productId: string;
  qty: number;
}
export interface PurchaseOrderData {
  receiptUrl: string;
  totalItemsOnReceipt: number;
  notes?: string;
  items: PurchaseOrderItemData[];
}

export const createPurchaseOrder = async (data: PurchaseOrderData) => {
  return prisma.$transaction(async (tx) => {
    // 1. Create Purchase Order
    const newPo = await tx.purchaseOrder.create({
      data: {
        receiptUrl: data.receiptUrl,
        totalItemsOnReceipt: data.totalItemsOnReceipt,
        notes: data.notes,
      },
    });

    // 2. Create Items and update stock
    for (const item of data.items) {
      await tx.purchaseOrderItem.create({
        data: {
          purchaseOrderId: newPo.id,
          productId: item.productId,
          qty: item.qty,
        },
      });

      await tx.monitorStock.update({
        where: { productId: item.productId },
        data: { currentStock: { increment: item.qty } },
      });
    }

    return await tx.purchaseOrder.findUnique({
      where: { id: newPo.id },
      include: { items: true },
    });
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
