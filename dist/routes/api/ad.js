"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adController_1 = require("../../controllers/adController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const uploadMiddleware_1 = __importDefault(require("../../middleware/uploadMiddleware"));
const adRoutes = express_1.default.Router();
// Public: Get ads to display
adRoutes.get("/", adController_1.getAllAds);
// Protected: Admin operations
adRoutes.post("/", authMiddleware_1.verifyAuthToken, uploadMiddleware_1.default.any(), adController_1.createAd);
adRoutes.put("/:id", authMiddleware_1.verifyAuthToken, uploadMiddleware_1.default.any(), adController_1.updateAd);
adRoutes.patch("/:id/toggle", authMiddleware_1.verifyAuthToken, adController_1.toggleAdStatus);
adRoutes.delete("/:id", authMiddleware_1.verifyAuthToken, adController_1.deleteAd);
exports.default = adRoutes;
