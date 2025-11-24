import prisma from "~/prisma";

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
