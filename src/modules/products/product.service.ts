import prisma from "../../prisma";

export const listPublicProducts = async (params: {
  limit?: number;
  offset?: number;
  brandId?: string;
  brand?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  conditionId?: string;
  sortBy?: string;
}) => {
  const { limit = 8, offset = 0, brandId, brand, category, search, minPrice, maxPrice, conditionId, sortBy } = params;
  
  const where: any = { deletedAt: null };
  
  if (conditionId) {
    const conditionIds = conditionId.split(",");
    where.conditionId = { in: conditionIds };
  }
  
  if (brandId) {
    const brandIds = brandId.split(",");
    where.brandId = { in: brandIds };
  }

  if (brand) {
    const brandNames = brand.toLowerCase().split(",");
    const allBrands = await prisma.brand.findMany();
    const matchedBrandIds = allBrands.filter(b => brandNames.includes(b.name.toLowerCase())).map(b => b.id);
    if (matchedBrandIds.length > 0) {
      if (where.brandId) {
         where.brandId.in = [...new Set([...where.brandId.in, ...matchedBrandIds])];
      } else {
         where.brandId = { in: matchedBrandIds };
      }
    } else {
      where.brandId = { in: ['not-found'] };
    }
  }
  
  if (category) {
    const categories = category.split(",");
    where.category = { in: categories };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { brand: { name: { contains: search, mode: "insensitive" } } },
      { condition: { name: { contains: search, mode: "insensitive" } } },
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
      include: {
        brand: true,
        condition: true,
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } }
      }
    }),
    prisma.product.count({ where }),
  ]);

  const formattedProducts = products.map((p: any) => {
    const totalRating = p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    const averageRating = p._count.reviews > 0 ? (totalRating / p._count.reviews).toFixed(1) : 0;
    
    const { reviews, ...rest } = p; 
    return {
      ...rest,
      rating: Number(averageRating),
      reviewsCount: p._count.reviews
    };
  });

  return { products: formattedProducts, total };
};

export const listProductsForAdmin = async () => {
  return prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      brand: true,
      condition: true,
    }
  });
};

const PPN_RATE = process.env.PPN_RATE ? parseInt(process.env.PPN_RATE) : 11;

export const createProduct = async (data: any) => {
  if (data.price) {
    data.price = Math.round(data.price * (1 + PPN_RATE / 100));
  }
  return prisma.product.create({ data });
};

export const updateProduct = async (id: string, data: any) => {
  if (data.price) {
    data.price = Math.round(data.price * (1 + PPN_RATE / 100));
  }
  return prisma.product.update({ where: { id }, data });
};

export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: { orderItems: true },
      },
    },
  });

  if (!product) throw new Error("Product not found");

  // If product has stock or has been part of a transaction, soft delete it
  if (product.stock > 0 || product._count.orderItems > 0) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Otherwise, hard delete it
  return prisma.product.delete({ where: { id } });
};

export const getProductById = async (id: string) => {
  const p = await prisma.product.findUnique({ 
    where: { id },
    include: {
      brand: true,
      condition: true,
      reviews: { select: { rating: true } },
      _count: { select: { reviews: true } }
    }
  });

  if (!p) return null;

  const totalRating = p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
  const averageRating = p._count.reviews > 0 ? (totalRating / p._count.reviews).toFixed(1) : 0;
  
  const { reviews, ...rest } = p; 
  return {
    ...rest,
    rating: Number(averageRating),
    reviewsCount: p._count.reviews
  };
};

export const getTopSellingProducts = async (limit: number = 5) => {
  const result = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: {
      qty: true,
    },
    orderBy: {
      _sum: {
        qty: "desc",
      },
    },
    take: limit,
  });

  const productIds = result.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      deletedAt: null,
    },
    include: {
      brand: true,
      condition: true,
      reviews: { select: { rating: true } },
      _count: { select: { reviews: true } }
    }
  });

  return result.map((r) => {
    const p: any = products.find((pp) => pp.id === r.productId);
    const totalRating = p.reviews.reduce((sum: number, rev: any) => sum + rev.rating, 0);
    const averageRating = p._count.reviews > 0 ? (totalRating / p._count.reviews).toFixed(1) : 0;
    const { reviews, ...rest } = p;
    return {
      ...rest,
      rating: Number(averageRating),
      reviewsCount: p._count.reviews,
      totalSold: r._sum.qty,
    };
  });
};
