import { Router } from "express";
import { getDashboardOverview } from "../controllers/dashboardController.js";

const router = Router();

router.get("/", getDashboardOverview);

export default router;