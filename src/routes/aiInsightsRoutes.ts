
import { Router } from "express";
import { getAiInsights } from "../controllers/aiInsightsController";
// import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// router.use(requireAuth);

router.get("/", getAiInsights);

export default router;
