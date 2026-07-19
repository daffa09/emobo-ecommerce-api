import { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { asyncHandler } from "../../utils/async-handler";
import * as service from "./review.service";

export const postReview = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, productId, rating, comment } = req.body;

  const review = await service.createReview({
    orderId: orderId as string,
    productId: productId as string,
    userId: (req as any).user.id,
    rating: Number(rating),
    comment,
  });
  return sendResponse(res, 201, "review posted", review);
});

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await service.getProductReviews(req.params.productId);
  return sendResponse(res, 200, "fetch reviews success", reviews);
});
