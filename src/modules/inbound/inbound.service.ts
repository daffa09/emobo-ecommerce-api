import prisma from "../../prisma";

export interface inboundTransactionItemData {
  productId: string;
  qty: number;
  buyPrice: number;
  price: number;
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
          buyPrice: item.buyPrice,
          price: item.price,
        },
      });

      // Produk yang baru dibuat lewat Manage Products belum punya baris monitor_stock,
      // jadi baris pertamanya dibuat di sini (update saja akan gagal P2025).
      await tx.monitorStock.upsert({
        where: { productId: item.productId },
        create: { productId: item.productId, currentStock: item.qty },
        update: { currentStock: { increment: item.qty } },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          buyPrice: item.buyPrice,
          price: item.price,
        }
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
