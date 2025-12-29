"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const navMenuController_1 = require("../../controllers/navMenuController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.route("/").get(navMenuController_1.getNavMenu).put(authMiddleware_1.verifyAuthToken, navMenuController_1.updateNavMenu);
exports.default = router;
