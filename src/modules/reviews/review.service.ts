import prisma from "~/prisma";

export const createReview = async (data: {
  orderId: number;
  productId: number;
  userId: number;
  rating: number;
  comment?: string;
}) => {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
  });

  if (!order || order.userId !== data.userId) {
    throw new Error("Invalid order or user");
  }

  if (order.status !== "COMPLETED") {
    throw new Error("Can only review completed orders");
  }

  const review = await prisma.review.create({
    data: {
      orderId: data.orderId,
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      comment: data.comment,
    },
  });

  return review;
};

export const getProductReviews = async (productId: number) => {
  return prisma.review.findMany({
    where: { productId },
    include: {
      user: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
