
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Product from "../models/Product";
import StockMovement from "../models/StockMovement";
import { asyncHandler } from "../utils/asyncHandler";

export const getAiInsights = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const ownerId = new Types.ObjectId(userId);

    // Only analyze products belonging to the authenticated user.
    const products = await Product.find({ userId: ownerId })
      .select("name sku category price quantity minStock")
      .lean();

    const [
      stockInCount,
      stockOutCount,
      adjustmentCount,
      recentMovements,
    ] = await Promise.all([
      StockMovement.countDocuments({ userId: ownerId, type: "IN" }),
      StockMovement.countDocuments({ userId: ownerId, type: "OUT" }),
      StockMovement.countDocuments({
        userId: ownerId,
        type: "ADJUSTMENT",
      }),
      StockMovement.find({ userId: ownerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("productId", "name sku")
        .lean(),
    ]);

    const totalProducts = products.length;

    const totalUnits = products.reduce(
      (sum, product) => sum + (Number(product.quantity) || 0),
      0,
    );

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum +
        (Number(product.price) || 0) *
          (Number(product.quantity) || 0),
      0,
    );

    const lowStockProducts = products.filter(
      (product) =>
        Number(product.quantity) <= Number(product.minStock ?? 0),
    );

    const outOfStockProducts = products.filter(
      (product) => Number(product.quantity) <= 0,
    );

    const overstockProducts = products.filter((product) => {
      const quantity = Number(product.quantity) || 0;
      const minStock = Number(product.minStock) || 0;

      return minStock > 0 && quantity >= minStock * 5;
    });

    const categoryMap = new Map<
      string,
      { productCount: number; totalUnits: number; inventoryValue: number }
    >();

    for (const product of products) {
      const category = String(product.category || "Other");
      const current = categoryMap.get(category) || {
        productCount: 0,
        totalUnits: 0,
        inventoryValue: 0,
      };

      current.productCount += 1;
      current.totalUnits += Number(product.quantity) || 0;
      current.inventoryValue +=
        (Number(product.price) || 0) *
        (Number(product.quantity) || 0);

      categoryMap.set(category, current);
    }

    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.inventoryValue - a.inventoryValue);

    const insights = [];

    for (const product of lowStockProducts) {
      const isOutOfStock = Number(product.quantity) <= 0;

      insights.push({
        id: `low-stock-${product._id}`,
        type: isOutOfStock ? "critical" : "warning",
        category: "LOW_STOCK",
        title: isOutOfStock ? "Product out of stock" : "Low stock detected",
        description: `${product.name} has ${product.quantity} units remaining. Minimum stock level: ${product.minStock}.`,
        recommendation: isOutOfStock
          ? "Review this product and replenish stock if required."
          : "Review demand and consider replenishing this product.",
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          minStock: product.minStock,
        },
      });
    }

    for (const product of overstockProducts) {
      insights.push({
        id: `overstock-${product._id}`,
        type: "info",
        category: "POTENTIAL_OVERSTOCK",
        title: "Potential overstock",
        description: `${product.name} has ${product.quantity} units, at least five times its minimum stock level.`,
        recommendation:
          "Check sales history before ordering more. This rule alone does not prove excess inventory.",
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          minStock: product.minStock,
        },
      });
    }

    if (products.length > 0 && insights.length === 0) {
      insights.push({
        id: "inventory-healthy",
        type: "positive",
        category: "HEALTHY_INVENTORY",
        title: "Inventory levels look healthy",
        description:
          "No products currently match the low-stock or potential-overstock rules.",
        recommendation:
          "Continue monitoring stock and keep minimum stock levels up to date.",
      });
    }

    if (products.length === 0) {
      insights.push({
        id: "no-products",
        type: "info",
        category: "NO_DATA",
        title: "No inventory data available",
        description: "Add products to generate inventory insights.",
        recommendation: "Create your first product to get started.",
      });
    }

    insights.sort((a, b) => {
      const priority: Record<string, number> = {
        critical: 0,
        warning: 1,
        info: 2,
        positive: 3,
      };

      return priority[a.type] - priority[b.type];
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalUnits,
          inventoryValue,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          overstockCount: overstockProducts.length,
          categoryCount: categories.length,
        },
        movements: {
          stockIn: stockInCount,
          stockOut: stockOutCount,
          adjustments: adjustmentCount,
        },
        categories,
        insights,
        recentMovements,
        generatedAt: new Date().toISOString(),
        analysisType: "rule-based",
      },
    });
  },
);
