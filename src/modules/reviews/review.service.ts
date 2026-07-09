import prisma from "../../prisma";
import { isValidRating } from "../../utils/validation";

export const createReview = async (data: {
  orderId: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
}) => {
  if (!isValidRating(data.rating)) {
    throw new Error("Rating must be an integer between 1 and 5");
  }

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { profile: { include: { user: true } } }
  });

  if (!order || (order.profile?.user?.id || "") !== data.userId) {
    throw new Error("Invalid order or user");
  }

  if (order.status !== "COMPLETED") {
    throw new Error("Can only review completed orders");
  }

  const review = await prisma.review.create({
    data: {
      orderId: data.orderId,
      productId: data.productId,
      profileId: order.profileId,
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
      profile: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};


