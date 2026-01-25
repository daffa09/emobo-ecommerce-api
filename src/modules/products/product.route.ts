import { Router } from "express";
import * as controller from "./product.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /products/public:
 *   get:
 *     summary: List public products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */
router.get("/public", controller.getPublicProducts); // public
router.get("/top-selling", controller.getTopSelling);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List all products (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *   post:
 *     summary: Create product (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created
 */
router.get("/", authMiddleware, adminOnly, controller.getProductsAdmin); // admin
router.post("/", authMiddleware, adminOnly, controller.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Product updated
 *   delete:
 *     summary: Delete product (Admin)
 *     tags: [Products]
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
 *         description: Product deleted
 */
router.put("/:id", authMiddleware, adminOnly, controller.updateProduct);
router.delete("/:id", authMiddleware, adminOnly, controller.deleteProduct);

export default router;
