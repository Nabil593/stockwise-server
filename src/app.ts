import express from "express";
import cors from "cors";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "20kb" }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Inventory API is running",
  });
});

import productRoutes from "./routes/productRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

app.use("/api/products", productRoutes);
app.use(errorHandler);

import stockMovementRoutes from "./routes/stockMovementRoutes";
app.use("/api/stock", stockMovementRoutes);

import aiInsightsRoutes from "./routes/aiInsightsRoutes";
app.use("/api/ai/insights", aiInsightsRoutes);

import dashboardRoutes from "./routes/dashboardRoutes.js";
app.use("/api/dashboard", dashboardRoutes);

export default app;