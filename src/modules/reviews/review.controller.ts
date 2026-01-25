import { Request, Response } from "express";
import { sendResponse } from "~/utils/response";
import * as service from "./review.service";

export const postReview = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { orderId, productId, rating, comment } = req.body;

  try {
    const review = await service.createReview({
      orderId: Number(orderId),
      productId: Number(productId),
      userId,
      rating: Number(rating),
      comment,
    });
    return sendResponse(res, 201, "review posted", review);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

export const getReviews = async (req: Request, res: Response) => {
  const productId = Number(req.params.productId);
  try {
    const reviews = await service.getProductReviews(productId);
    return sendResponse(res, 200, "fetch reviews success", reviews);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};
