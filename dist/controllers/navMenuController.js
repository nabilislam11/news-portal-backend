"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNavMenu = exports.getNavMenu = void 0;
const createError_1 = require("../utils/createError"); // Importing your custom error handler
const navMenu_1 = require("../models/navMenu");
const asyncHandler_1 = require("../utils/asyncHandler");
// @desc    Get the main navigation menu
// @route   GET /api/navmenu
// @access  Public
exports.getNavMenu = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const menu = await navMenu_1.NavMenu.findOne({}).populate("categoryIds", "name slug");
    if (!menu) {
        // Return empty array if not set up yet
        res.status(200).json([]);
        return;
    }
    // FIX: Safe access with fallback to empty array
    // Prevents crash if 'categoryIds' is undefined/null in the DB
    const categories = (menu.categoryIds || []).filter(Boolean);
    res.status(200).json(categories);
});
// @desc    Update navigation categories (Max 10)
// @route   PUT /api/navmenu
// @access  Private/Admin
exports.updateNavMenu = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { categoryIds } = req.body;
    if (!categoryIds || categoryIds.length > 10) {
        // Using your custom error util
        throw (0, createError_1.createError)("You can only select up to 10 categories.", 400);
    }
    const menu = await navMenu_1.NavMenu.findOneAndUpdate({}, { categoryIds }, { new: true, upsert: true, runValidators: true }).populate("categoryIds", "name slug");
    res.status(200).json(menu.categoryIds);
});
