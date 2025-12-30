"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = void 0;
const validateEnv = () => {
    // List all the variables you absolutely NEED
    const requiredEnv = [
        "NODE_ENV",
        "DB_URL",
        "JWT_SECRET",
        "RESEND_API_KEY",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
        "ADMIN_EMAIL",
        "APP_NAME",
        "PORT",
    ];
    const missingKeys = [];
    // Check each one
    requiredEnv.forEach((key) => {
        if (!process.env[key]) {
            missingKeys.push(key);
        }
    });
    // If any are missing, crash the app with a clear list
    if (missingKeys.length > 0) {
        console.error("❌ FATAL ERROR: Missing required environment variables:");
        missingKeys.forEach((key) => console.error(`   - ${key}`));
        // Exit the process (1 = failure)
        process.exit(1);
    }
    console.log("✅ Environment variables validated successfully.");
};
exports.validateEnv = validateEnv;
