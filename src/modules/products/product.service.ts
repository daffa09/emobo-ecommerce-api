import prisma from "../../prisma";

export const listPublicProducts = async () => {
  return prisma.product.findMany();
};

export const listProductsForAdmin = async () => {
  return prisma.product.findMany();
};

export const createProduct = async (data: any) => {
  return prisma.product.create({ data });
};

export const updateProduct = async (id: number, data: any) => {
  return prisma.product.update({ where: { id }, data });
};

export const deleteProduct = async (id: number) => {
  return prisma.product.delete({ where: { id } });
};

export const getTopSellingProducts = async (limit: number = 5) => {
  const result = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  const productIds = result.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
  });

  return result.map((r) => {
    const p = products.find((pp) => pp.id === r.productId);
    return {
      ...p,
      totalSold: r._sum.quantity,
    };
  });
};
