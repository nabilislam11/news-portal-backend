"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLimiter = exports.searchLimiter = exports.otpRateLimiter = exports.loginRateLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// 1. LOGIN LIMITER (Strict)
// Prevents brute-force password guessing
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    skipSuccessfulRequests: true, // Only count failures
    message: {
        success: false,
        message: "Too many failed login attempts. Please try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// 2. OTP/EMAIL LIMITER (Strict)
// Prevents email bombing/spamming
exports.otpRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Allow only 3 OTP requests per hour per IP
    message: {
        success: false,
        message: "Too many verification requests. Please try again in an hour.",
    },
});
// 3. SEARCH LIMITER (Moderate)
// Prevents database exhaustion from search spam
exports.searchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: {
        success: false,
        message: "Too many search requests. Please slow down.",
    },
});
// 4. ADMIN LIMITER (Moderate)
// Extra layer of security for admin actions
exports.adminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50,
    message: {
        success: false,
        message: "Too many admin operations. Please slow down.",
    },
});
