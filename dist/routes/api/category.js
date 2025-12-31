"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_1 = require("../../controllers/categoryController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const categoryRoutes = express_1.default.Router();
// Public
categoryRoutes.get("/", categoryController_1.getAllCategories);
categoryRoutes.get("/slug/:slug", categoryController_1.getCategoryBySlug);
categoryRoutes.get("/:id", categoryController_1.getCategoryById);
// Protected
categoryRoutes.post("/", authMiddleware_1.verifyAuthToken, categoryController_1.createCategory);
categoryRoutes.put("/:id", authMiddleware_1.verifyAuthToken, categoryController_1.updateCategory);
categoryRoutes.patch("/:id/toggle", authMiddleware_1.verifyAuthToken, categoryController_1.toggleCategoryStatus);
categoryRoutes.delete("/:id", authMiddleware_1.verifyAuthToken, categoryController_1.deleteCategory);
exports.default = categoryRoutes;
//# sourceMappingURL=category.js.map