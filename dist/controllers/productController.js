"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.listProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Product_js_1 = __importDefault(require("../models/Product.js"));
const asyncHandler_js_1 = require("../utils/asyncHandler.js");
const allowedCategories = [
    "Electronics",
    "Accessories",
    "Office Equipment",
    "Furniture",
    "Bags",
    "Other",
];
const allowedFields = [
    "name",
    "sku",
    "category",
    "description",
    "price",
    "quantity",
    "minStock",
];
function isValidObjectId(id) {
    return mongoose_1.default.Types.ObjectId.isValid(id);
}
function validateProductBody(body, isUpdate = false) {
    const errors = [];
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return {
            errors: ["Request body must be a JSON object"],
        };
    }
    const input = body;
    const data = {};
    const fieldsToCheck = isUpdate ? Object.keys(input) : [...allowedFields];
    if (isUpdate && fieldsToCheck.length === 0) {
        errors.push("Provide at least one field to update");
    }
    for (const field of fieldsToCheck) {
        if (!allowedFields.includes(field)) {
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
            if (typeof value !== "string" ||
                value.trim().length < 2 ||
                value.trim().length > 120) {
                errors.push("Name must be 2–120 characters");
            }
            else {
                data.name = value.trim();
            }
        }
        if (field === "sku") {
            if (typeof value !== "string" ||
                !/^[a-zA-Z0-9_-]{1,64}$/.test(value.trim())) {
                errors.push("SKU must contain only letters, numbers, hyphens, or underscores");
            }
            else {
                data.sku = value.trim().toUpperCase();
            }
        }
        if (field === "category") {
            if (typeof value !== "string" ||
                !allowedCategories.includes(value)) {
                errors.push("Invalid product category");
            }
            else {
                data.category = value;
            }
        }
        if (field === "description") {
            if (typeof value !== "string" || value.length > 500) {
                errors.push("Description must be a string of at most 500 characters");
            }
            else {
                data.description = value;
            }
        }
        if (field === "price" || field === "quantity" || field === "minStock") {
            if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
                errors.push(`${field} must be a non-negative number`);
            }
            else if ((field === "quantity" || field === "minStock") &&
                !Number.isInteger(value)) {
                errors.push(`${field} must be a whole number`);
            }
            else {
                data[field] = value;
            }
        }
    }
    return errors.length > 0 ? { errors } : { data, errors: [] };
}
// GET /api/products
exports.listProducts = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const filter = { userId };
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
        Product_js_1.default.find(filter)
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Product_js_1.default.countDocuments(filter),
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
});
// GET /api/products/:productId
exports.getProduct = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { productId } = req.params;
    if (typeof productId !== "string" || !isValidObjectId(productId)) {
        res.status(400).json({
            success: false,
            message: "Invalid product ID",
        });
        return;
    }
    const product = await Product_js_1.default.findOne({
        _id: productId,
        userId: req.user.id,
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
exports.createProduct = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const validation = validateProductBody(req.body);
    if (validation.errors.length > 0) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: validation.errors,
        });
        return;
    }
    const product = await Product_js_1.default.create({
        ...validation.data,
        userId: req.user.id,
    });
    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
    });
});
// PATCH /api/products/:productId
exports.updateProduct = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
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
    const product = await Product_js_1.default.findOneAndUpdate({
        _id: productId,
        userId: req.user.id,
    }, {
        $set: validation.data,
    }, {
        new: true,
        runValidators: true,
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
        message: "Product updated successfully",
        data: product,
    });
});
// DELETE /api/products/:productId
exports.deleteProduct = (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const productId = req.params.productId;
    if (typeof productId !== "string" || !isValidObjectId(productId)) {
        res.status(400).json({
            success: false,
            message: "Invalid product ID",
        });
        return;
    }
    const product = await Product_js_1.default.findOneAndDelete({
        _id: productId,
        userId: req.user.id,
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
});
