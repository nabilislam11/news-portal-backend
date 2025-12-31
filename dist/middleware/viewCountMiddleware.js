"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackPostView = void 0;
const request_ip_1 = __importDefault(require("request-ip"));
const mongoose_1 = __importDefault(require("mongoose"));
const postSchema_1 = require("../models/postSchema");
const postViewSchema_1 = require("../models/postViewSchema");
// NOTE: We removed 'asyncHandler' because this function is now SYNCHRONOUS.
// It calls next() immediately and runs the DB logic in the background.
const trackPostView = (req, res, next) => {
    // ==========================================
    // 1. EXTRACT DATA (Fast & Synchronous)
    // ==========================================
    const postId = req.params.id || req.params.postId;
    // Safety: If ID is invalid, skip tracking
    if (!postId || !mongoose_1.default.isValidObjectId(postId)) {
        return next();
    }
    const userAgent = req.headers["user-agent"] || "unknown";
    let clientIp = request_ip_1.default.getClientIp(req) || "unknown";
    // Normalize IP
    if (clientIp === "::1")
        clientIp = "127.0.0.1";
    if (clientIp.startsWith("::ffff:"))
        clientIp = clientIp.replace("::ffff:", "");
    // ==========================================
    // 2. THE FIX: FIRE-AND-FORGET
    // ==========================================
    // We call next() INSTANTLY. The user sees the page immediately.
    // We do NOT wait for the database here.
    next();
    // ==========================================
    // 3. BACKGROUND WORKER
    // ==========================================
    // This logic runs in the "background" while the user reads the post.
    (async () => {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            // Check Uniqueness (Read)
            const existingView = await postViewSchema_1.PostView.findOne({
                post: postId,
                ip: clientIp,
                userAgent: userAgent,
                createdAt: { $gte: twentyFourHoursAgo },
            });
            // If Unique, Write to DB
            if (!existingView) {
                await Promise.all([
                    // Log for Dashboard
                    postViewSchema_1.PostView.create({
                        post: postId,
                        ip: clientIp,
                        userAgent: userAgent,
                    }),
                    // Increment Public Counter
                    postSchema_1.Post.findByIdAndUpdate(postId, { $inc: { views: 1 } }),
                ]);
            }
        }
        catch (error) {
            // SILENT FAIL: If this fails, we just log it.
            // The user's experience is not interrupted.
            console.error("Background View Tracking Error:", error);
        }
    })();
};
exports.trackPostView = trackPostView;
//# sourceMappingURL=viewCountMiddleware.js.map