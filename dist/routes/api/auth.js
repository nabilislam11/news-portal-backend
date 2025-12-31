"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuthController_1 = require("../../controllers/adminAuthController");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const authRoutes = express_1.default.Router();
authRoutes.post("/login", rateLimiter_1.loginRateLimiter, adminAuthController_1.login);
authRoutes.post("/request-verification", adminAuthController_1.requestVerification);
authRoutes.post("/verify-otp", rateLimiter_1.otpRateLimiter, adminAuthController_1.verifyOTP);
authRoutes.post("/reset-password", adminAuthController_1.resetPassword);
authRoutes.delete("/logout", authMiddleware_1.verifyAuthToken, adminAuthController_1.logout);
authRoutes.get("/me", authMiddleware_1.verifyAuthToken, adminAuthController_1.getMe);
authRoutes.get("/public-socials", adminAuthController_1.getAdminSocials);
authRoutes.put("/socials", authMiddleware_1.verifyAuthToken, adminAuthController_1.updateSocialLinks);
authRoutes.put("/change-password", authMiddleware_1.verifyAuthToken, adminAuthController_1.changePassword);
exports.default = authRoutes;
//# sourceMappingURL=auth.js.map