"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUsername = exports.changePassword = exports.updateSocialLinks = exports.getMe = exports.logout = exports.resetPassword = exports.verifyOTP = exports.requestVerification = exports.login = void 0;
const adminSchema_1 = __importDefault(require("../models/adminSchema"));
const createError_1 = require("../utils/createError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const sendEmail_1 = require("../utils/sendEmail");
const asyncHandler_1 = require("../utils/asyncHandler");
// 1. LOGIN
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw (0, createError_1.createError)("Email and Password are required.", 400);
    }
    const admin = await adminSchema_1.default.findOne({ email }).select("+password");
    if (!admin) {
        throw (0, createError_1.createError)("Invalid email or password.", 401);
    }
    const isMatch = await admin.compareField("password", password);
    if (!isMatch) {
        throw (0, createError_1.createError)("Invalid email or password", 401);
    }
    // Generate JWT
    const payload = { id: admin._id, email: admin.email, username: admin.username };
    if (!process.env.JWT_SECRET) {
        throw (0, createError_1.createError)("JWT_SECRET environment variable is not defined", 500);
    }
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "365d",
    });
    // Set Cookie
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
    res.status(200).json({
        success: true,
        message: "Login successful",
        data: admin,
    });
});
// 2. REQUEST OTP
exports.requestVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email)
        throw (0, createError_1.createError)("Email is required.", 400);
    const admin = await adminSchema_1.default.findOne({ email }).select("+otp +otpExpiry +otpAttempts +lastOtpRequest +lockedUntil +resetSessionActive +resetSessionExpiry +otpVerified");
    if (!admin)
        throw (0, createError_1.createError)("Admin not found.", 404);
    // Check Lock
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
        const remainingTime = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
        throw (0, createError_1.createError)(`Account is locked. Try again after ${remainingTime} minutes.`, 403);
    }
    // Check if already verified & session active (Prevent spamming if already ready to reset)
    if (admin.otpVerified && admin.resetSessionActive) {
        throw (0, createError_1.createError)("You are already verified and your reset session is still valid. Please go to the resetPassword page.", 400);
    }
    // 1 Minute Cooldown check
    if (admin.lastOtpRequest) {
        const timeSinceLastRequest = (Date.now() - admin.lastOtpRequest.getTime()) / 1000;
        if (timeSinceLastRequest < 60) {
            throw (0, createError_1.createError)(`Please wait ${60 - Math.floor(timeSinceLastRequest)} second${timeSinceLastRequest > 1 ? "s" : ""} before requesting a new OTP.`, 429);
        }
    }
    // Generate OTP
    const otp = crypto_1.default.randomInt(100000, 999999).toString();
    // Update DB
    admin.otp = otp;
    admin.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    admin.lastOtpRequest = new Date();
    admin.otpAttempts = 0;
    admin.lockedUntil = null;
    admin.resetSessionActive = true;
    admin.resetSessionExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    admin.otpVerified = false;
    await admin.save();
    // Send Email
    (0, sendEmail_1.sendEmail)(email, "verification", otp).catch((err) => console.error("Email failed:", err));
    res.status(200).json({
        success: true,
        message: "OTP sent to your email",
    });
});
// 3. VERIFY OTP
exports.verifyOTP = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp)
        throw (0, createError_1.createError)("Email and OTP are required.", 400);
    const admin = await adminSchema_1.default.findOne({ email }).select("+otp +otpExpiry +otpAttempts +lastOtpRequest +lockedUntil +resetSessionActive +resetSessionExpiry +otpVerified");
    if (!admin)
        throw (0, createError_1.createError)("Admin not found.", 404);
    if (admin.otpVerified)
        throw (0, createError_1.createError)("You are already verified", 400);
    // Check Reset Session existence
    if (!admin.resetSessionActive) {
        throw (0, createError_1.createError)("No active reset password session. Please request OTP first", 400);
    }
    // Check Reset Session Expiry
    if (!admin.resetSessionExpiry || admin.resetSessionExpiry < new Date()) {
        admin.resetSessionActive = false;
        admin.otp = null;
        admin.otpExpiry = null;
        admin.otpVerified = false;
        await admin.save();
        throw (0, createError_1.createError)("Reset session expired. Please request a new OTP", 400);
    }
    // Check Lock
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
        throw (0, createError_1.createError)(`Account is locked. Please try again later.`, 403);
    }
    // Check OTP Expiry
    if (!admin.otpExpiry || admin.otpExpiry < new Date()) {
        throw (0, createError_1.createError)("OTP has expired. Please request a new one.", 400);
    }
    // Check OTP Match
    const isMatch = await admin.compareField("otp", otp);
    // Handle Wrong OTP
    if (!isMatch) {
        admin.otpAttempts = (admin.otpAttempts || 0) + 1;
        // Lock after 3 failed attempts
        if (admin.otpAttempts >= 3) {
            admin.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
            admin.otpAttempts = 0;
            admin.otp = null;
            admin.otpExpiry = null;
            admin.resetSessionActive = false;
            admin.otpVerified = false;
            await admin.save();
            throw (0, createError_1.createError)("Too many failed attempts. Account locked for 30 minutes", 429);
        }
        await admin.save();
        throw (0, createError_1.createError)(`Wrong OTP. ${3 - admin.otpAttempts} attempts remaining`, 400);
    }
    // Handle Success
    admin.otp = null;
    admin.lockedUntil = null;
    admin.otpExpiry = null;
    admin.otpAttempts = 0;
    admin.otpVerified = true;
    await admin.save();
    res.status(200).json({
        success: true,
        message: "OTP verified successfully. You can now reset your password",
    });
});
// 4. RESET PASSWORD
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        throw (0, createError_1.createError)("Email and password are required", 400);
    if (password.length < 8)
        throw (0, createError_1.createError)("Password must be at least 8 characters", 400);
    const admin = await adminSchema_1.default.findOne({ email }).select("+resetSessionActive +resetSessionExpiry +otpVerified");
    if (!admin)
        throw (0, createError_1.createError)("Admin not found.", 404);
    // Verification Check
    if (!admin.otpVerified)
        throw (0, createError_1.createError)("Please verify your email first.", 403);
    // Session Check
    if (!admin.resetSessionActive) {
        throw (0, createError_1.createError)("No active password reset session. Please verify OTP first", 400);
    }
    if (!admin.resetSessionExpiry || admin.resetSessionExpiry < new Date()) {
        admin.resetSessionActive = false;
        await admin.save();
        throw (0, createError_1.createError)("Reset session expired. Please start over with OTP verification.", 400);
    }
    // Update Password
    admin.password = password; // Assuming your Model has a "pre-save" hook to Hash this!
    admin.resetSessionActive = false;
    admin.resetSessionExpiry = null;
    admin.otpVerified = false; // Reset verification status
    await admin.save();
    res.status(200).json({
        success: true,
        message: "Password reset successful. You can now login with your new password.",
    });
});
// 5. LOGOUT
const logout = (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};
exports.logout = logout;
// ------------------ PROFILE --------------------------------
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const admin = await adminSchema_1.default.findById(req.admin?.id);
    if (!admin)
        throw (0, createError_1.createError)("Admin account not found", 404);
    res.status(200).json({ success: true, data: admin });
});
// 7. UPDATE SOCIAL LINKS (Authenticated)
// ==========================================
exports.updateSocialLinks = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { facebook, twitter, linkedin, instagram, youtube } = req.body;
    const admin = await adminSchema_1.default.findById(req.admin?.id);
    if (!admin)
        throw (0, createError_1.createError)("Admin not found", 404);
    // Initialize if missing
    if (!admin.socialLinks) {
        admin.socialLinks = { facebook: "", twitter: "", linkedin: "", instagram: "", youtube: "" };
    }
    // Update provided fields
    if (facebook !== undefined)
        admin.socialLinks.facebook = facebook;
    if (twitter !== undefined)
        admin.socialLinks.twitter = twitter;
    if (linkedin !== undefined)
        admin.socialLinks.linkedin = linkedin;
    if (instagram !== undefined)
        admin.socialLinks.instagram = instagram;
    if (youtube !== undefined)
        admin.socialLinks.youtube = youtube;
    // IMPORTANT: Mark modified for nested objects
    admin.markModified("socialLinks");
    await admin.save();
    res.status(200).json({
        success: true,
        message: "Social links updated successfully",
        data: admin.socialLinks,
    });
});
// 8. CHANGE PASSWORD (Authenticated)
// ==========================================
exports.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw (0, createError_1.createError)("Please provide both current and new passwords", 400);
    }
    if (newPassword.length < 8) {
        throw (0, createError_1.createError)("New password must be at least 8 characters", 400);
    }
    const admin = await adminSchema_1.default.findById(req.admin?.id).select("+password");
    if (!admin)
        throw (0, createError_1.createError)("Admin not found", 404);
    const isMatch = await admin.compareField("password", currentPassword);
    if (!isMatch)
        throw (0, createError_1.createError)("Incorrect current password", 401);
    admin.password = newPassword;
    await admin.save();
    res.status(200).json({ success: true, message: "Password changed successfully" });
});
// 9. NEW: UPDATE USERNAME
exports.updateUsername = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { username } = req.body;
    if (!username) {
        throw (0, createError_1.createError)("Username is required", 400);
    }
    // Validation matching schema rules
    if (username.length < 2 || username.length > 30) {
        throw (0, createError_1.createError)("Username must be between 2 and 30 characters", 400);
    }
    const admin = await adminSchema_1.default.findById(req.admin?.id);
    if (!admin)
        throw (0, createError_1.createError)("Admin not found", 404);
    admin.username = username;
    await admin.save();
    res.status(200).json({
        success: true,
        message: "Username updated successfully",
        data: { username: admin.username },
    });
});
