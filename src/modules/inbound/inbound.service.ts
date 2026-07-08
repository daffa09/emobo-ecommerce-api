import prisma from "../../prisma";

export interface inboundTransactionItemData {
  productId: string;
  qty: number;
}
export interface inboundTransactionData {
  receiptUrl: string;
  totalItemsOnReceipt: number;
  notes?: string;
  items: inboundTransactionItemData[];
}

export const createinboundTransaction = async (data: inboundTransactionData) => {
  return prisma.$transaction(async (tx) => {
    // 1. Create Inbound Transaction
    const newPo = await tx.inboundTransaction.create({
      data: {
        receiptUrl: data.receiptUrl,
        totalItemsOnReceipt: data.totalItemsOnReceipt,
        notes: data.notes,
      },
    });

    // 2. Create Items and update stock
    for (const item of data.items) {
      await tx.inboundItem.create({
        data: {
          inboundTransactionId: newPo.id,
          productId: item.productId,
          qty: item.qty,
        },
      });

      await tx.monitorStock.update({
        where: { productId: item.productId },
        data: { currentStock: { increment: item.qty } },
      });
    }

    return await tx.inboundTransaction.findUnique({
      where: { id: newPo.id },
      include: { items: true },
    });
  });
};

export const listinboundTransactions = async () => {
  return prisma.inboundTransaction.findMany({
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

export const getinboundTransactionById = async (id: string) => {
  return prisma.inboundTransaction.findUnique({
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
