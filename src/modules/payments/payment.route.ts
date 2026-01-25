import { Router } from "express";
import * as ctrl from "./payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management
 */

/**
 * @swagger
 * /payments/{orderId}/create:
 *   post:
 *     summary: Create payment for order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Payment created
 *       400:
 *         description: Error creating payment
 */
router.post("/:orderId/create", authMiddleware, ctrl.createPayment);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Webhook for payment provider
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providerId:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post("/webhook", ctrl.webhook); // public endpoint called by provider

/**
 * @swagger
 * /payments/{orderId}/status:
 *   get:
 *     summary: Get payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment status
 *       404:
 *         description: Payment not found
 */
router.get("/:orderId/status", authMiddleware, ctrl.getPaymentStatus);

export default router;
