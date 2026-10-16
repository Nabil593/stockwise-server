import { Router } from "express";

import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = Router();

router.get("/", listProducts);
router.post("/", createProduct);
router.get("/:productId", getProduct);
router.patch("/:productId", updateProduct);
router.delete("/:productId", deleteProduct);

export default router;