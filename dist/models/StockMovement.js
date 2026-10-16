"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const stockMovementSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["IN", "OUT", "ADJUSTMENT"],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    quantityBefore: {
        type: Number,
        required: true,
        min: 0,
    },
    quantityAfter: {
        type: Number,
        required: true,
        min: 0,
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
    },
}, {
    timestamps: true,
});
stockMovementSchema.index({ userId: 1, createdAt: -1 });
const StockMovement = mongoose_1.models.StockMovement ||
    (0, mongoose_1.model)("StockMovement", stockMovementSchema);
exports.default = StockMovement;
