"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.disable("x-powered-by");
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json({ limit: "20kb" }));
app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "Inventory API is running",
    });
});
const productRoutes_js_1 = __importDefault(require("./routes/productRoutes.js"));
const requireAuth_js_1 = require("./middlewares/requireAuth.js");
const errorHandler_js_1 = require("./middlewares/errorHandler.js");
app.use("/api/products", requireAuth_js_1.requireAuth, productRoutes_js_1.default);
app.use(errorHandler_js_1.errorHandler);
const stockMovementRoutes_1 = __importDefault(require("./routes/stockMovementRoutes"));
app.use("/api/stock", stockMovementRoutes_1.default);
const aiInsightsRoutes_1 = __importDefault(require("./routes/aiInsightsRoutes"));
app.use("/api/ai/insights", aiInsightsRoutes_1.default);
const dashboardRoutes_js_1 = __importDefault(require("./routes/dashboardRoutes.js"));
app.use("/api/dashboard", dashboardRoutes_js_1.default);
exports.default = app;
