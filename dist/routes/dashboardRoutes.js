"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_js_1 = require("../controllers/dashboardController.js");
const requireAuth_js_1 = require("../middlewares/requireAuth.js");
const router = (0, express_1.Router)();
router.get("/", requireAuth_js_1.requireAuth, dashboardController_js_1.getDashboardOverview);
exports.default = router;
