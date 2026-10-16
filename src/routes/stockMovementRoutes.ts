import { Router } from "express";
import {
  createStockMovement,
  getStockMovements,
  getStockSummary,
} from "../controllers/stockMovementController";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// All stock endpoints require authentication.
router.use(requireAuth);

router.get("/summary", getStockSummary);
router.get("/movements", getStockMovements);
router.post("/movements", createStockMovement);

export default router;