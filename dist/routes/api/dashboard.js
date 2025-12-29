"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboardController_1 = require("../../controllers/dashboardController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const dashboardRoutes = express_1.default.Router();
// Protected: Only Admin can see the dashboard stats
dashboardRoutes.get("/stats", authMiddleware_1.verifyAuthToken, dashboardController_1.getDashboardStats);
exports.default = dashboardRoutes;
