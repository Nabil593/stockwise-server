import { Router } from "express";
import { getDashboardOverview } from "../controllers/dashboardController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/", requireAuth, getDashboardOverview);

export default router;