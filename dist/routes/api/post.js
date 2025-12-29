"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const postController_1 = require("../../controllers/postController");
const uploadMiddleware_1 = __importDefault(require("../../middleware/uploadMiddleware"));
const viewCountMiddleware_1 = require("../../middleware/viewCountMiddleware");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const postRoutes = express_1.default.Router();
// ==========================================
// PUBLIC ROUTES
// ==========================================
// 1. Search & Trending (MUST be defined before /:postId)
postRoutes.get("/search", rateLimiter_1.searchLimiter, postController_1.searchPosts);
postRoutes.get("/trending", postController_1.getTrendingPosts);
postRoutes.get("/", postController_1.getAllPosts);
postRoutes.get("/:postId", viewCountMiddleware_1.trackPostView, postController_1.getPostById);
postRoutes.get("/filter/:id", postController_1.getPostsByFilter);
// Create: Accept any field name. Middleware blocks non-images.
postRoutes.post("/", authMiddleware_1.verifyAuthToken, uploadMiddleware_1.default.any(), postController_1.createPost);
postRoutes.put("/:postId", authMiddleware_1.verifyAuthToken, uploadMiddleware_1.default.any(), postController_1.updatePost);
postRoutes.delete("/:postId", authMiddleware_1.verifyAuthToken, postController_1.deletePost);
exports.default = postRoutes;
