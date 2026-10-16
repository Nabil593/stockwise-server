import { Schema, model, models, Types } from "mongoose";

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT";

export interface IStockMovement {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  type: StockMovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    productId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  },
);

stockMovementSchema.index({ userId: 1, createdAt: -1 });

const StockMovement =
  models.StockMovement ||
  model<IStockMovement>("StockMovement", stockMovementSchema);

export default StockMovement;