"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleAdStatus = exports.deleteAd = exports.updateAd = exports.getAllAds = exports.createAd = void 0;
const fs_1 = __importDefault(require("fs"));
const adSchema_1 = require("../models/adSchema");
const cloudinary_1 = require("../utils/cloudinary");
const createError_1 = require("../utils/createError");
const asyncHandler_1 = require("../utils/asyncHandler");
// ==========================================
// HELPERS
// ==========================================
// Helper: Non-blocking file deletion
// Prevents server freeze during high traffic
const safeDelete = (path) => {
    fs_1.default.unlink(path, (err) => {
        if (err)
            console.error(`Failed to delete file at ${path}:`, err);
    });
};
const getFile = (req) => {
    if (Array.isArray(req.files) && req.files.length > 0)
        return req.files[0];
    if (req.files && typeof req.files === "object") {
        const values = Object.values(req.files);
        if (values.length > 0 && values[0].length > 0)
            return values[0][0];
    }
    return undefined;
};
// ==========================================
// CONTROLLERS
// ==========================================
// 1. Create Ad
exports.createAd = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { title, type, link, isActive } = req.body;
    const file = getFile(req);
    // FIX 1: Cleanup file if text validation fails (Non-blocking)
    if (!title || !type || !link) {
        if (file)
            safeDelete(file.path);
        throw (0, createError_1.createError)("Title, type, and link are required", 400);
    }
    // FIX 2: Cleanup file if Enum validation fails (Non-blocking)
    if (!["horizontal", "square"].includes(type)) {
        if (file)
            safeDelete(file.path);
        throw (0, createError_1.createError)("Invalid type. Must be 'horizontal' or 'square'", 400);
    }
    if (!file)
        throw (0, createError_1.createError)("Ad image is required", 400);
    // Upload
    const imageData = await (0, cloudinary_1.uploadToCloudinary)(file.path, "news-ads");
    // Cleanup local file immediately (Non-blocking)
    if (file)
        safeDelete(file.path);
    try {
        const ad = await adSchema_1.Ad.create({
            title,
            type,
            link,
            image: imageData,
            isActive: isActive === "true" || isActive === true,
        });
        res.status(201).json({ success: true, message: "Ad created successfully", data: ad });
    }
    catch (error) {
        await (0, cloudinary_1.deleteFromCloudinary)(imageData.publicId);
        throw error;
    }
});
// 2. Get All Ads
exports.getAllAds = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { type, isActive } = req.query;
    const filter = {};
    if (type)
        filter.type = type;
    if (isActive !== undefined)
        filter.isActive = isActive === "true";
    const ads = await adSchema_1.Ad.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: ads.length, data: ads });
});
// 3. Update Ad
exports.updateAd = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { title, type, link, isActive } = req.body;
    const file = getFile(req);
    const ad = await adSchema_1.Ad.findById(id);
    if (!ad) {
        // FIX 3: Cleanup file if Ad not found (Non-blocking)
        if (file)
            safeDelete(file.path);
        throw (0, createError_1.createError)("Ad not found", 404);
    }
    let imageData = ad.image;
    let newImageUploaded = false;
    try {
        if (file) {
            imageData = await (0, cloudinary_1.uploadToCloudinary)(file.path, "news-ads");
            newImageUploaded = true;
            if (file)
                safeDelete(file.path);
        }
        const updatedAd = await adSchema_1.Ad.findByIdAndUpdate(id, {
            title,
            type,
            link,
            image: imageData,
            isActive: isActive !== undefined ? isActive : ad.isActive,
        }, { new: true });
        // If new image success, delete OLD image from cloud
        if (file && ad.image?.publicId) {
            await (0, cloudinary_1.deleteFromCloudinary)(ad.image.publicId);
        }
        res.status(200).json({ success: true, message: "Ad updated", data: updatedAd });
    }
    catch (error) {
        // If update fails, delete NEW image from cloud
        if (newImageUploaded && imageData.publicId) {
            await (0, cloudinary_1.deleteFromCloudinary)(imageData.publicId);
        }
        // Double check local file is gone
        if (file)
            safeDelete(file.path);
        throw error;
    }
});
// 4. Delete Ad
exports.deleteAd = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const ad = await adSchema_1.Ad.findById(id);
    if (!ad)
        throw (0, createError_1.createError)("Ad not found", 404);
    if (ad.image?.publicId) {
        await (0, cloudinary_1.deleteFromCloudinary)(ad.image.publicId);
    }
    await adSchema_1.Ad.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Ad deleted successfully" });
});
// 5. Toggle Status
exports.toggleAdStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const ad = await adSchema_1.Ad.findById(id);
    if (!ad)
        throw (0, createError_1.createError)("Ad not found", 404);
    ad.isActive = !ad.isActive;
    await ad.save();
    res.status(200).json({ success: true, message: "Ad status updated", data: ad });
});
//# sourceMappingURL=adController.js.map