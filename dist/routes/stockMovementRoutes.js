"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stockMovementController_1 = require("../controllers/stockMovementController");
const requireAuth_1 = require("../middlewares/requireAuth");
const router = (0, express_1.Router)();
// All stock endpoints require authentication.
router.use(requireAuth_1.requireAuth);
router.get("/summary", stockMovementController_1.getStockSummary);
router.get("/movements", stockMovementController_1.getStockMovements);
router.post("/movements", stockMovementController_1.createStockMovement);
exports.default = router;
