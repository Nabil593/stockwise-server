"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_js_1 = __importDefault(require("./app.js"));
const db_js_1 = require("./config/db.js");
const PORT = Number(process.env.PORT) || 5000;
async function startServer() {
    await (0, db_js_1.connectDB)();
    app_js_1.default.listen(PORT, () => {
        console.log(`Inventory API running at http://localhost:${PORT}`);
    });
}
startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
