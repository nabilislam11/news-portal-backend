"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnect = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dbConnect = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error("FATAL ERROR:MONGODB_URI is not defined in .env");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(mongoUri, {
            maxPoolSize: 10, // Prevent overwhelming the DB (10 parallel connections max)
            minPoolSize: 2, // Keep 2 connections ready for instant response
            socketTimeoutMS: 45000, // Kill "zombie" connections after 45s of silence
        });
        console.log("✅ Database connected successfully");
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
};
exports.dbConnect = dbConnect;
//# sourceMappingURL=db.config.js.map