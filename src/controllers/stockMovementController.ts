import type { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Product from "../models/Product";
import StockMovement from "../models/StockMovement";
import { asyncHandler } from "../utils/asyncHandler";

type MovementType = "IN" | "OUT" | "ADJUSTMENT";

const validTypes: MovementType[] = ["IN", "OUT", "ADJUSTMENT"];

const getUserId = (req: Request): string => req.user!.id;

const isValidObjectId = (id: string): boolean =>
  mongoose.isValidObjectId(id);

// POST /api/stock/movements
export const createStockMovement = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
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

    // Product must belong to the currently authenticated user.
    const product = await Product.findOne({
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
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productObjectId,
        userId,
        quantity:
          type === "OUT"
            ? { $gte: quantity }
            : quantityBefore,
      },
      {
        $set: {
          quantity: quantityAfter,
        },
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
        userId: new Types.ObjectId(userId),
        productId: productObjectId,
        type,
        // For ADJUSTMENT, quantity is the new stock total.
        quantity,
        quantityBefore,
        quantityAfter,
        reason: reason.trim(),
        notes: typeof notes === "string" ? notes.trim() : "",
      });

      const populatedMovement = await StockMovement.findById(
        movement._id,
      ).populate("productId", "name sku");

      res.status(201).json({
        success: true,
        message: "Stock movement recorded successfully.",
        data: populatedMovement,
      });
    } catch (error) {
      // Compensate if recording the movement fails.
      // Only restore if this request's quantity is still current.
      await Product.updateOne(
        {
          _id: productObjectId,
          userId,
          quantity: quantityAfter,
        },
        {
          $set: {
            quantity: quantityBefore,
          },
        },
      );

      throw error;
    }
  },
);

// GET /api/stock/movements
export const getStockMovements = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 50),
    );

    const filter: Record<string, unknown> = { userId };

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
        ...(filter.createdAt as object | undefined),
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
        ...(filter.createdAt as object | undefined),
        $lte: to,
      };
    }

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate({
          path: "productId",
          select: "name sku category",
          match: { userId },
        })
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
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const [productStats, movementStats, lowStockCount] =
      await Promise.all([
        Product.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
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

        StockMovement.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
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

        Product.countDocuments({
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
      if (item._id === "IN") movementSummary.stockIn = item.count;
      if (item._id === "OUT") movementSummary.stockOut = item.count;
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
  },
);