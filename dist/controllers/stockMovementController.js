"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockSummary = exports.getStockMovements = exports.createStockMovement = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const Product_1 = __importDefault(require("../models/Product"));
const StockMovement_1 = __importDefault(require("../models/StockMovement"));
const asyncHandler_1 = require("../utils/asyncHandler");
const validTypes = ["IN", "OUT", "ADJUSTMENT"];
const getUserId = (req) => req.user.id;
const isValidObjectId = (id) => mongoose_1.default.isValidObjectId(id);
// POST /api/stock/movements
exports.createStockMovement = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const { productId, type, quantity, reason, notes } = req.body;
    if (typeof productId !== "string" ||
        !isValidObjectId(productId)) {
        res.status(400).json({
            success: false,
            message: "A valid product ID is required.",
        });
        return;
    }
    if (!validTypes.includes(type)) {
        res.status(400).json({
            success: false,
            message: "Movement type must be IN, OUT, or ADJUSTMENT.",
        });
        return;
    }
    if (typeof quantity !== "number" ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1) {
        res.status(400).json({
            success: false,
            message: "Quantity must be a positive whole number.",
        });
        return;
    }
    if (typeof reason !== "string" ||
        !reason.trim() ||
        reason.trim().length > 100) {
        res.status(400).json({
            success: false,
            message: "A reason is required (maximum 100 characters).",
        });
        return;
    }
    if (notes !== undefined &&
        (typeof notes !== "string" || notes.length > 500)) {
        res.status(400).json({
            success: false,
            message: "Notes must be 500 characters or fewer.",
        });
        return;
    }
    const productObjectId = new mongoose_1.Types.ObjectId(productId);
    // Product must belong to the currently authenticated user.
    const product = await Product_1.default.findOne({
        _id: productObjectId,
        userId,
    });
    if (!product) {
        res.status(404).json({
            success: false,
            message: "Product not found.",
        });
        return;
    }
    const quantityBefore = product.quantity;
    let quantityAfter;
    if (type === "IN") {
        quantityAfter = quantityBefore + quantity;
    }
    else if (type === "OUT") {
        if (quantity > quantityBefore) {
            res.status(400).json({
                success: false,
                message: `Insufficient stock. Available quantity: ${quantityBefore}.`,
            });
            return;
        }
        quantityAfter = quantityBefore - quantity;
    }
    else {
        // For ADJUSTMENT, quantity means the new total stock quantity.
        quantityAfter = quantity;
    }
    if (!Number.isSafeInteger(quantityAfter) || quantityAfter < 0) {
        res.status(400).json({
            success: false,
            message: "The resulting stock quantity is invalid.",
        });
        return;
    }
    // Conditional update prevents an OUT movement from overselling
    // if another request changes the stock at the same time.
    const updatedProduct = await Product_1.default.findOneAndUpdate({
        _id: productObjectId,
        userId,
        quantity: type === "OUT"
            ? { $gte: quantity }
            : quantityBefore,
    }, {
        $set: {
            quantity: quantityAfter,
        },
    }, {
        new: true,
        runValidators: true,
    });
    if (!updatedProduct) {
        res.status(409).json({
            success: false,
            message: "Stock changed during this request. Please try again.",
        });
        return;
    }
    try {
        const movement = await StockMovement_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            productId: productObjectId,
            type,
            // For ADJUSTMENT, quantity is the new stock total.
            quantity,
            quantityBefore,
            quantityAfter,
            reason: reason.trim(),
            notes: typeof notes === "string" ? notes.trim() : "",
        });
        const populatedMovement = await StockMovement_1.default.findById(movement._id).populate("productId", "name sku");
        res.status(201).json({
            success: true,
            message: "Stock movement recorded successfully.",
            data: populatedMovement,
        });
    }
    catch (error) {
        // Compensate if recording the movement fails.
        // Only restore if this request's quantity is still current.
        await Product_1.default.updateOne({
            _id: productObjectId,
            userId,
            quantity: quantityAfter,
        }, {
            $set: {
                quantity: quantityBefore,
            },
        });
        throw error;
    }
});
// GET /api/stock/movements
exports.getStockMovements = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const filter = { userId };
    if (typeof req.query.type === "string") {
        if (!validTypes.includes(req.query.type)) {
            res.status(400).json({
                success: false,
                message: "Invalid movement type.",
            });
            return;
        }
        filter.type = req.query.type;
    }
    if (typeof req.query.productId === "string") {
        if (!isValidObjectId(req.query.productId)) {
            res.status(400).json({
                success: false,
                message: "Invalid product ID.",
            });
            return;
        }
        filter.productId = new mongoose_1.Types.ObjectId(req.query.productId);
    }
    if (typeof req.query.from === "string") {
        const from = new Date(req.query.from);
        if (Number.isNaN(from.getTime())) {
            res.status(400).json({
                success: false,
                message: "Invalid start date.",
            });
            return;
        }
        filter.createdAt = {
            ...filter.createdAt,
            $gte: from,
        };
    }
    if (typeof req.query.to === "string") {
        const to = new Date(req.query.to);
        if (Number.isNaN(to.getTime())) {
            res.status(400).json({
                success: false,
                message: "Invalid end date.",
            });
            return;
        }
        filter.createdAt = {
            ...filter.createdAt,
            $lte: to,
        };
    }
    const [movements, total] = await Promise.all([
        StockMovement_1.default.find(filter)
            .populate({
            path: "productId",
            select: "name sku category",
            match: { userId },
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        StockMovement_1.default.countDocuments(filter),
    ]);
    res.status(200).json({
        success: true,
        data: movements,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});
// GET /api/stock/summary
exports.getStockSummary = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const [productStats, movementStats, lowStockCount] = await Promise.all([
        Product_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalUnits: { $sum: "$quantity" },
                    inventoryValue: {
                        $sum: { $multiply: ["$price", "$quantity"] },
                    },
                },
            },
        ]),
        StockMovement_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                    quantity: { $sum: "$quantity" },
                },
            },
        ]),
        Product_1.default.countDocuments({
            userId,
            $expr: { $lte: ["$quantity", "$minStock"] },
        }),
    ]);
    const stats = productStats[0] || {
        totalProducts: 0,
        totalUnits: 0,
        inventoryValue: 0,
    };
    const movementSummary = {
        stockIn: 0,
        stockOut: 0,
        adjustments: 0,
    };
    for (const item of movementStats) {
        if (item._id === "IN")
            movementSummary.stockIn = item.count;
        if (item._id === "OUT")
            movementSummary.stockOut = item.count;
        if (item._id === "ADJUSTMENT") {
            movementSummary.adjustments = item.count;
        }
    }
    res.status(200).json({
        success: true,
        data: {
            totalProducts: stats.totalProducts,
            totalUnits: stats.totalUnits,
            inventoryValue: stats.inventoryValue,
            lowStockCount,
            movements: movementSummary,
        },
    });
});
