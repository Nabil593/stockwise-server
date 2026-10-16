"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof mongoose_1.default.Error.ValidationError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: Object.values(error.errors).map((item) => item.message),
        });
        return;
    }
    if (error instanceof mongoose_1.default.Error.CastError) {
        res.status(400).json({
            success: false,
            message: "Invalid ID or field value",
        });
        return;
    }
    if (error.code === 11000) {
        res.status(409).json({
            success: false,
            message: "This SKU already exists in your inventory",
        });
        return;
    }
    console.error(error);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
exports.errorHandler = errorHandler;
