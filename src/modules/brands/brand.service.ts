import prisma from "../../prisma";

export const getAllBrands = async () => {
  return await prisma.brand.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const getBrandById = async (id: string) => {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw new Error("Brand not found");
  return brand;
};

export const createBrand = async (data: { name: string }) => {
  if (!data.name) throw new Error("Brand name is required");
  const existing = await prisma.brand.findUnique({ where: { name: data.name } });
  if (existing) throw new Error("Brand already exists");
  return await prisma.brand.create({ data });
};

export const updateBrand = async (id: string, data: { name?: string }) => {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw new Error("Brand not found");
  
  if (data.name && data.name !== brand.name) {
    const existing = await prisma.brand.findUnique({ where: { name: data.name } });
    if (existing) throw new Error("Brand already exists");
  }

  return await prisma.brand.update({
    where: { id },
    data,
  });
};

export const deleteBrand = async (id: string) => {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) throw new Error("Brand not found");
  if (brand._count.products > 0) {
    throw new Error("Cannot delete brand. It has associated products.");
  }
  return await prisma.brand.delete({ where: { id } });
};
