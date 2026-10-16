
import type { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Product from "../models/Product";
import StockMovement from "../models/StockMovement";
import { asyncHandler } from "../utils/asyncHandler";

type MovementType = "IN" | "OUT" | "ADJUSTMENT";

const validTypes: MovementType[] = ["IN", "OUT", "ADJUSTMENT"];

const isValidObjectId = (id: string): boolean =>
  mongoose.isValidObjectId(id);

// POST /api/stock/movements
export const createStockMovement = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, type, quantity, reason, notes } = req.body;

    if (
      typeof productId !== "string" ||
      !isValidObjectId(productId)
    ) {
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

    if (
      typeof quantity !== "number" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      res.status(400).json({
        success: false,
        message: "Quantity must be a positive whole number.",
      });
      return;
    }

    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 100
    ) {
      res.status(400).json({
        success: false,
        message: "A reason is required (maximum 100 characters).",
      });
      return;
    }

    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.length > 500)
    ) {
      res.status(400).json({
        success: false,
        message: "Notes must be 500 characters or fewer.",
      });
      return;
    }

    const productObjectId = new Types.ObjectId(productId);

    // Public access: find product without user authentication.
    const product = await Product.findById(productObjectId);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found.",
      });
      return;
    }

    const quantityBefore = product.quantity;
    let quantityAfter: number;

    if (type === "IN") {
      quantityAfter = quantityBefore + quantity;
    } else if (type === "OUT") {
      if (quantity > quantityBefore) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock. Available quantity: ${quantityBefore}.`,
        });
        return;
      }

      quantityAfter = quantityBefore - quantity;
    } else {
      // ADJUSTMENT quantity represents the new total stock.
      quantityAfter = quantity;
    }

    if (!Number.isSafeInteger(quantityAfter) || quantityAfter < 0) {
      res.status(400).json({
        success: false,
        message: "The resulting stock quantity is invalid.",
      });
      return;
    }

    // Update stock only if the original quantity has not changed.
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productObjectId,
        quantity: quantityBefore,
      },
      {
        $set: { quantity: quantityAfter },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedProduct) {
      res.status(409).json({
        success: false,
        message: "Stock changed during this request. Please try again.",
      });
      return;
    }

    try {
      const movement = await StockMovement.create({
        productId: productObjectId,
        type,
        quantity,
        quantityBefore,
        quantityAfter,
        reason: reason.trim(),
        notes: typeof notes === "string" ? notes.trim() : "",
      });

      const populatedMovement = await StockMovement.findById(
        movement._id,
      ).populate("productId", "name sku category");

      res.status(201).json({
        success: true,
        message: "Stock movement recorded successfully.",
        data: populatedMovement,
      });
    } catch (error) {
      // Restore the previous stock if movement creation fails.
      await Product.updateOne(
        {
          _id: productObjectId,
          quantity: quantityAfter,
        },
        {
          $set: { quantity: quantityBefore },
        },
      );

      throw error;
    }
  },
);

// GET /api/stock/movements
export const getStockMovements = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 50),
    );

    const filter: Record<string, unknown> = {};

    if (typeof req.query.type === "string") {
      if (!validTypes.includes(req.query.type as MovementType)) {
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

      filter.productId = new Types.ObjectId(req.query.productId);
    }

    const createdAt: Record<string, Date> = {};

    if (typeof req.query.from === "string") {
      const from = new Date(req.query.from);

      if (Number.isNaN(from.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid start date.",
        });
        return;
      }

      createdAt.$gte = from;
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

      createdAt.$lte = to;
    }

    if (Object.keys(createdAt).length > 0) {
      filter.createdAt = createdAt;
    }

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate("productId", "name sku category")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      StockMovement.countDocuments(filter),
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
  },
);

// GET /api/stock/summary
export const getStockSummary = asyncHandler(
  async (_req: Request, res: Response) => {
    const [productStats, movementStats, lowStockCount] =
      await Promise.all([
        Product.aggregate([
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

        StockMovement.aggregate([
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
              quantity: { $sum: "$quantity" },
            },
          },
        ]),

        Product.countDocuments({
          $expr: { $lte: ["$quantity", "$minStock"] },
        }),
      ]);

    const stats = productStats[0] || {
      totalProducts: 0,
      totalUnits: 0,
      inventoryValue: 0,
    };

    const movements = {
      stockIn: 0,
      stockOut: 0,
      adjustments: 0,
    };

    for (const item of movementStats) {
      if (item._id === "IN") movements.stockIn = item.count;
      if (item._id === "OUT") movements.stockOut = item.count;
      if (item._id === "ADJUSTMENT") {
        movements.adjustments = item.count;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalProducts: stats.totalProducts,
        totalUnits: stats.totalUnits,
        inventoryValue: stats.inventoryValue,
        lowStockCount,
        movements,
      },
    });
  },
);