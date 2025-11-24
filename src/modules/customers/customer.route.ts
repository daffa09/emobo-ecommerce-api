import { Router } from "express";
import * as ctrl from "./customer.controller";
import { authMiddleware } from "~/middleware/auth.middleware";
import { adminOnly } from "~/middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management (Admin only)
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: List all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get("/", authMiddleware, adminOnly, ctrl.listCustomers);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer details
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 */
router.get("/:id", authMiddleware, adminOnly, ctrl.getCustomer);

export default router;
