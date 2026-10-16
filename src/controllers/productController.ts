import mongoose from "mongoose";
import type { Request, Response } from "express";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const allowedCategories = [
  "Electronics",
  "Accessories",
  "Office Equipment",
  "Furniture",
  "Bags",
  "Other",
] as const;

const allowedFields = [
  "name",
  "sku",
  "category",
  "description",
  "price",
  "quantity",
  "minStock",
] as const;

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateProductBody(
  body: unknown,
  isUpdate = false,
): {
  data?: Record<string, unknown>;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      errors: ["Request body must be a JSON object"],
    };
  }

  const input = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  const fieldsToCheck = isUpdate ? Object.keys(input) : [...allowedFields];

  if (isUpdate && fieldsToCheck.length === 0) {
    errors.push("Provide at least one field to update");
  }

  for (const field of fieldsToCheck) {
    if (!allowedFields.includes(field as (typeof allowedFields)[number])) {
      errors.push(`Unknown field: ${field}`);
      continue;
    }

    const value = input[field];

    if (value === undefined) {
      if (!isUpdate) {
        errors.push(`${field} is required`);
      }
      continue;
    }

    if (field === "name") {
      if (
        typeof value !== "string" ||
        value.trim().length < 2 ||
        value.trim().length > 120
      ) {
        errors.push("Name must be 2–120 characters");
      } else {
        data.name = value.trim();
      }
    }

    if (field === "sku") {
      if (
        typeof value !== "string" ||
        !/^[a-zA-Z0-9_-]{1,64}$/.test(value.trim())
      ) {
        errors.push(
          "SKU must contain only letters, numbers, hyphens, or underscores",
        );
      } else {
        data.sku = value.trim().toUpperCase();
      }
    }

    if (field === "category") {
      if (
        typeof value !== "string" ||
        !allowedCategories.includes(value as (typeof allowedCategories)[number])
      ) {
        errors.push("Invalid product category");
      } else {
        data.category = value;
      }
    }

    if (field === "description") {
      if (typeof value !== "string" || value.length > 500) {
        errors.push("Description must be a string of at most 500 characters");
      } else {
        data.description = value;
      }
    }

    if (field === "price" || field === "quantity" || field === "minStock") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        errors.push(`${field} must be a non-negative number`);
      } else if (
        (field === "quantity" || field === "minStock") &&
        !Number.isInteger(value)
      ) {
        errors.push(`${field} must be a whole number`);
      } else {
        data[field] = value;
      }
    }
  }

  return errors.length > 0 ? { errors } : { data, errors: [] };
}

// GET /api/products
export const listProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const category =
      typeof req.query.category === "string" ? req.query.category : "";

    const filter: Record<string, unknown> = { userId };

    if (category) {
      filter.category = category;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { sku: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  },
);

// GET /api/products/:productId
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  if (typeof productId !== "string" || !isValidObjectId(productId)) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
    return;
  }

  const product = await Product.findOne({
    _id: productId,
    userId: req.user!.id,
  }).lean();

  if (!product) {
    res.status(404).json({
      success: false,
      message: "Product not found",
    });
    return;
  }

  res.json({
    success: true,
    data: product,
  });
});

// POST /api/products
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const validation = validateProductBody(req.body);

    if (validation.errors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
      return;
    }

    const product = await Product.create({
      ...validation.data,
      userId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  },
);

// PATCH /api/products/:productId
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.productId;

    if (typeof productId !== "string" || !isValidObjectId(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const validation = validateProductBody(req.body, true);

    if (validation.errors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
      return;
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        userId: req.user!.id,
      },
      {
        $set: validation.data,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  },
);

// DELETE /api/products/:productId
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.productId;

    if (typeof productId !== "string" || !isValidObjectId(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await Product.findOneAndDelete({
      _id: productId,
      userId: req.user!.id,
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  },
);
