import prisma from "../../prisma";

export const listPublicProducts = async (params: {
  limit?: number;
  offset?: number;
  brand?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}) => {
  const { limit = 8, offset = 0, brand, category, search, minPrice, maxPrice, sortBy } = params;

  const where: any = {};
  
  if (brand) {
    const brands = brand.split(",");
    where.brand = { in: brands };
  }
  
  if (category) {
    const categories = category.split(",");
    where.category = { in: categories };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  const orderBy: any = {};
  if (sortBy === "price_asc") orderBy.price = "asc";
  else if (sortBy === "price_desc") orderBy.price = "desc";
  else if (sortBy === "newest") orderBy.createdAt = "desc";

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: Object.keys(orderBy).length > 0 ? orderBy : { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
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
