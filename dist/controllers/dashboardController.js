"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardOverview = void 0;
const Product_js_1 = __importDefault(require("../models/Product.js"));
const StockMovement_js_1 = __importDefault(require("../models/StockMovement.js"));
const getDashboardOverview = async (req, res, next) => {
    try {
        // Assumption: requireAuth adds the authenticated user's ID to req.user.
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const products = await Product_js_1.default.find({ userId })
            .select("name sku category price quantity minStock")
            .lean();
        const totalProducts = products.length;
        const summary = products.reduce((acc, product) => {
            const quantity = Number(product.quantity) || 0;
            const price = Number(product.price) || 0;
            const minStock = Number(product.minStock) || 0;
            acc.totalUnits += quantity;
            acc.inventoryValue += price * quantity;
            if (quantity <= 0) {
                acc.outOfStockCount += 1;
            }
            else if (quantity <= minStock) {
                acc.lowStockCount += 1;
            }
            return acc;
        }, {
            totalUnits: 0,
            inventoryValue: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
        });
        const categoryMap = new Map();
        for (const product of products) {
            const category = product.category || "Other";
            const quantity = Number(product.quantity) || 0;
            const price = Number(product.price) || 0;
            const current = categoryMap.get(category) || {
                productCount: 0,
                totalUnits: 0,
                inventoryValue: 0,
            };
            current.productCount += 1;
            current.totalUnits += quantity;
            current.inventoryValue += price * quantity;
            categoryMap.set(category, current);
        }
        const categories = Array.from(categoryMap.entries()).map(([name, values]) => ({
            name,
            ...values,
        }));
        // Last 7 days, including today.
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 6);
        const movements = await StockMovement_js_1.default.find({
            userId,
            createdAt: { $gte: startDate },
        })
            .select("type quantity createdAt productId reason")
            .populate("productId", "name sku")
            .sort({ createdAt: -1 })
            .lean();
        const movementChartMap = new Map();
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const key = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0"),
            ].join("-");
            movementChartMap.set(key, {
                date: key,
                stockIn: 0,
                stockOut: 0,
            });
        }
        let stockIn = 0;
        let stockOut = 0;
        let adjustments = 0;
        for (const movement of movements) {
            const quantity = Number(movement.quantity) || 0;
            if (movement.type === "IN") {
                stockIn += quantity;
            }
            else if (movement.type === "OUT") {
                stockOut += quantity;
            }
            else if (movement.type === "ADJUSTMENT") {
                adjustments += quantity;
            }
            const createdAt = new Date(movement.createdAt);
            const key = [
                createdAt.getFullYear(),
                String(createdAt.getMonth() + 1).padStart(2, "0"),
                String(createdAt.getDate()).padStart(2, "0"),
            ].join("-");
            const day = movementChartMap.get(key);
            if (day) {
                if (movement.type === "IN")
                    day.stockIn += quantity;
                if (movement.type === "OUT")
                    day.stockOut += quantity;
            }
        }
        const recentMovements = await StockMovement_js_1.default.find({ userId })
            .select("type quantity createdAt productId reason")
            .populate("productId", "name sku")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        const lowStockProducts = products.filter((product) => {
            const quantity = Number(product.quantity) || 0;
            const minStock = Number(product.minStock) || 0;
            return quantity > 0 && quantity <= minStock;
        });
        const outOfStockProducts = products.filter((product) => (Number(product.quantity) || 0) <= 0);
        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalProducts,
                    ...summary,
                    categoryCount: categories.length,
                    lowStockCount: lowStockProducts.length,
                    outOfStockCount: outOfStockProducts.length,
                },
                categories,
                movementChart: Array.from(movementChartMap.values()),
                movements: {
                    stockIn,
                    stockOut,
                    adjustments,
                },
                lowStockProducts: lowStockProducts.slice(0, 5),
                outOfStockProducts: outOfStockProducts.slice(0, 5),
                recentMovements,
                generatedAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardOverview = getDashboardOverview;
