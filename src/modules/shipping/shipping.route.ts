import { Router } from "express";
import * as controller from "./shipping.controller";

const router = Router();

router.get("/provinces", controller.getProvinces);
router.get("/cities", controller.getCities);
router.post("/cost", controller.calculateCost);

export default router;
