import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoute from "./modules/auth/auth.route";
import productRoute from "./modules/products/product.route";
import customerRoute from "./modules/customers/customer.route";
import orderRoute from "./modules/orders/order.route";
import paymentRoute from "./modules/payments/payment.route";
import shippingRoute from "./modules/shipping/shipping.route";
import reviewRoute from "./modules/reviews/review.route";
import reportRoute from "./modules/reports/report.route";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import docsRoute from "./routes/docs.route";

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/customers", customerRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/payments", paymentRoute);
app.use("/api/v1/shipping", shippingRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/reports", reportRoute);
app.use("/api/v1/documentation", docsRoute);

app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

export default app;
