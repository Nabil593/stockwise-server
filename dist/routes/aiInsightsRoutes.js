"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiInsightsController_1 = require("../controllers/aiInsightsController");
const requireAuth_1 = require("../middlewares/requireAuth");
const router = (0, express_1.Router)();
router.use(requireAuth_1.requireAuth);
router.get("/", aiInsightsController_1.getAiInsights);
exports.default = router;
