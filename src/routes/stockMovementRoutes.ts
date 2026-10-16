import { Router } from "express";
import {
  createStockMovement,
  getStockMovements,
  getStockSummary,
} from "../controllers/stockMovementController";

const router = Router();

router.get("/summary", getStockSummary);
router.get("/movements", getStockMovements);
router.post("/movements", createStockMovement);

export default router;