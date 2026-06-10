import prisma from "../../prisma";

export const createReview = async (data: {
  orderId: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
}) => {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { biodata: true }
  });

  if (!order || order.biodata.userId !== data.userId) {
    throw new Error("Invalid order or user");
  }

  if (order.status !== "COMPLETED") {
    throw new Error("Can only review completed orders");
  }

  const review = await prisma.review.create({
    data: {
      orderId: data.orderId,
      productId: data.productId,
      biodataId: order.biodataId,
      rating: data.rating,
      comment: data.comment,
    },
  });

  return review;
};

export const getProductReviews = async (productId: string) => {
  return prisma.review.findMany({
    where: { productId },
    include: {
      biodata: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
