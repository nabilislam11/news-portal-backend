"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 1. Load dotenv FIRST
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 2. Validate Env SECOND (Before importing app or db)
const validateEnv_1 = require("./utils/validateEnv");
(0, validateEnv_1.validateEnv)();
// 3. Now import the rest
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./routes/index"));
const db_config_1 = require("./configs/db.config");
const errorHandler_1 = require("./middleware/errorHandler");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || "api/v1";
(async () => {
    try {
        // Crucial for Render: Allows Express to trust the HTTPS proxy
        app.set("trust proxy", 1);
        app.use((0, cors_1.default)({
            // Dynamic origin: Uses your ENV variable in production, falls back to localhost for dev
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true,
        }));
        app.use((0, cookie_parser_1.default)());
        app.use(express_1.default.json());
        app.use(express_1.default.urlencoded({ extended: true }));
        app.use(index_1.default);
        app.use(errorHandler_1.errorHandler);
        // Connect to DB before listening
        await (0, db_config_1.dbConnect)();
        app.listen(PORT, () => console.log(`✅ Server running - http://localhost:${PORT}${BASE_URL}`));
    }
    catch (error) {
        console.error("Something went wrong:", error);
        process.exit(1); // Exit process on critical failure
    }
})();
