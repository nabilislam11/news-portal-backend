"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middleware/authMiddleware");
const subscriptionController_1 = require("../../controllers/subscriptionController");
const subscriptionRoutes = express_1.default.Router();
// Public: User subscribes
subscriptionRoutes.post("/", subscriptionController_1.subscribe);
// Protected: Admin views and deletes
subscriptionRoutes.get("/", authMiddleware_1.verifyAuthToken, subscriptionController_1.getAllSubscriptions);
subscriptionRoutes.delete("/:id", authMiddleware_1.verifyAuthToken, subscriptionController_1.deleteSubscription);
exports.default = subscriptionRoutes;
//# sourceMappingURL=subscription.js.map