"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.toggleCategoryStatus = exports.updateCategory = exports.getCategoryBySlug = exports.getCategoryById = exports.getAllCategories = exports.createCategory = void 0;
const createError_1 = require("../utils/createError");
const categorySchema_1 = __importDefault(require("../models/categorySchema"));
const subCategorySchema_1 = __importDefault(require("../models/subCategorySchema")); // Must import to check safety
const postSchema_1 = require("../models/postSchema");
const asyncHandler_1 = require("../utils/asyncHandler");
// 1. Create Category
exports.createCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, description } = req.body;
    if (!name)
        throw (0, createError_1.createError)("Category name is required", 400);
    const existing = await categorySchema_1.default.findOne({ name });
    if (existing)
        throw (0, createError_1.createError)("Category already exists", 409);
    // We rely on the Model's pre('save') hook to generate the slug
    const category = new categorySchema_1.default({
        name,
        description: description || null,
    });
    await category.save();
    res.status(201).json({ success: true, message: "Category created", data: category });
});
// 2. Get All Categories (With SubCategories populated safely)
exports.getAllCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const categories = await categorySchema_1.default.find({ isActive: true })
        .populate({
        path: "subCategories", // Uses the Virtual field
        select: "name slug isActive",
        match: { isActive: true },
    })
        .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
});
// 3. Get Category By ID
exports.getCategoryById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await categorySchema_1.default.findById(req.params.id).populate("subCategories");
    if (!category)
        throw (0, createError_1.createError)("Category not found", 404);
    res.status(200).json({ success: true, data: category });
});
// 4. Get Category By Slug (Frontend URL friendly)
exports.getCategoryBySlug = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await categorySchema_1.default.findOne({ slug: req.params.slug }).populate("subCategories");
    if (!category)
        throw (0, createError_1.createError)("Category not found", 404);
    res.status(200).json({ success: true, data: category });
});
// 5. Update Category
exports.updateCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, description, isActive } = req.body;
    const { id } = req.params;
    const category = await categorySchema_1.default.findById(id);
    if (!category)
        throw (0, createError_1.createError)("Category not found", 404);
    // Check Duplicates if name changes
    if (name && name !== category.name) {
        const duplicate = await categorySchema_1.default.findOne({ name });
        if (duplicate)
            throw (0, createError_1.createError)("Category name already exists", 409);
        category.name = name; // Slug updates automatically in Model hook
    }
    if (description !== undefined)
        category.description = description;
    if (isActive !== undefined)
        category.isActive = isActive;
    await category.save();
    res.status(200).json({ success: true, message: "Updated successfully", data: category });
});
// 6. Toggle Status
exports.toggleCategoryStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await categorySchema_1.default.findById(req.params.id);
    if (!category)
        throw (0, createError_1.createError)("Category not found", 404);
    category.isActive = !category.isActive;
    await category.save();
    res.status(200).json({
        success: true,
        message: `Category is now ${category.isActive ? "Active" : "Inactive"}`,
        data: category,
    });
});
// 7. Delete Category (Safe Mode)
exports.deleteCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const category = await categorySchema_1.default.findById(id);
    if (!category)
        throw (0, createError_1.createError)("Category not found", 404);
    // Safety: Check if subcategories exist (returns 0 if you don't use them)
    const subCount = await subCategorySchema_1.default.countDocuments({ category: id });
    if (subCount > 0) {
        throw (0, createError_1.createError)("Cannot delete: This category has subcategories.", 400);
    }
    // Safety: Check if Posts exist
    const postCount = await postSchema_1.Post.countDocuments({ category: id });
    if (postCount > 0) {
        throw (0, createError_1.createError)(`Cannot delete: This category is used in ${postCount} posts.`, 400);
    }
    await categorySchema_1.default.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Category deleted successfully" });
});
