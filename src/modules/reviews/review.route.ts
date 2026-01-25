import { Router } from "express";
import * as controller from "./review.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, controller.postReview);
router.get("/product/:productId", controller.getReviews);

export default router;
