"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 1. Load dotenv FIRST
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 2. Validate Env
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { validateEnv } = require("./utils/validateEnv");
    validateEnv();
}
catch (err) {
    console.warn("⚠️ Env validation warning:", err.message);
}
// 3. Imports
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const index_1 = __importDefault(require("./routes/index"));
const db_config_1 = require("./configs/db.config");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
(async () => {
    try {
        app.set("trust proxy", 1);
        // --- CORS ---
        app.use((0, cors_1.default)({
            origin: [
                "https://protidinjonotarnews.com",
                "https://www.protidinjonotarnews.com",
                "http://localhost:5173",
                "https://app.requestly.io",
            ],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        }));
        app.use((0, cookie_parser_1.default)());
        app.use(express_1.default.json());
        app.use(express_1.default.urlencoded({ extended: true }));
        // ✅ FIXED: Hardcoded to "/api/v1" (No more Base URL variable issues)
        app.use("/api/v1", index_1.default);
        // ✅ DEBUG ROUTE
        app.get("/api/v1/hello", (_req, res) => {
            res.status(200).send("yes its live");
        });
        app.use(errorHandler_1.errorHandler);
        // --- START SERVER ---
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`👉 Test Link: http://localhost:${PORT}/api/v1/hello`);
            // Connect to DB in background
            (0, db_config_1.dbConnect)();
        });
    }
    catch (error) {
        console.error("❌ Critical Startup Error:", error);
    }
})();
//# sourceMappingURL=index.js.map