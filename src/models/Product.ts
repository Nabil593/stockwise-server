
import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
      maxlength: 64,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Electronics",
        "Accessories",
        "Office Equipment",
        "Furniture",
        "Bags",
        "Other",
      ],
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },

    minStock: {
      type: Number,
      required: true,
      min: [0, "Minimum stock cannot be negative"],
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// SKU must be unique across the shared inventory.
productSchema.index({ sku: 1 }, { unique: true });

const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

export default Product;