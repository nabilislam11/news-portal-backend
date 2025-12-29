"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const adminSchema_1 = __importDefault(require("../models/adminSchema"));
dotenv_1.default.config();
const seedSuperAdmin = async () => {
    try {
        const dbUrl = process.env.DB_URL;
        if (!dbUrl) {
            console.error("❌ Error: DB_URL is missing in .env file");
            process.exit(1);
        }
        await mongoose_1.default.connect(dbUrl);
        console.log("Database connected for seeding...");
        const superAdminEmail = process.env.ADMIN_EMAIL;
        if (!superAdminEmail) {
            console.error("❌ Error: ADMIN_EMAIL is missing in .env file");
            process.exit(1);
        }
        const exists = await adminSchema_1.default.findOne({ email: superAdminEmail });
        if (exists) {
            console.log("⚠️ Super Admin already exists. No action taken.");
            process.exit(0);
        }
        // Create Admin
        // (Password hashing is handled automatically by your Admin Model pre-save hook)
        await adminSchema_1.default.create({
            username: "Super Admin",
            email: superAdminEmail,
            password: "12345678", // You must change this after first login!
        });
        console.log("✅ Super Admin Created Successfully!");
        console.log(`📧 Email: ${superAdminEmail}`);
        console.log(`🔑 Temporary Password: 12345678`);
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Seeder Failed:", error);
        process.exit(1);
    }
};
seedSuperAdmin();
