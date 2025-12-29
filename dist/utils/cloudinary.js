"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const fs_1 = __importDefault(require("fs"));
const cloudinary_config_1 = __importDefault(require("../configs/cloudinary.config"));
const createError_1 = require("./createError");
// Helper: Upload image to Cloudinary & Delete local file
const uploadToCloudinary = async (filePath, folder = "general") => {
    try {
        // 1. Upload to Cloudinary
        const result = await cloudinary_config_1.default.uploader.upload(filePath, {
            folder: folder,
            // Resize to standard News Portal dimensions
            transformation: [{ width: 1200, height: 630, crop: "limit" }],
        });
        // 2. Delete local file after successful upload
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        catch (fsError) {
            console.error("Warning: Failed to delete local file:", filePath);
        }
        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }
    catch (error) {
        // Attempt to clean up local file even if upload failed
        if (fs_1.default.existsSync(filePath)) {
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch (e) {
                /* ignore */
            }
        }
        console.error("Cloudinary Upload Error:", error.message || error);
        throw (0, createError_1.createError)("Image upload to cloud failed. Please try again.", 500);
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
// Helper: Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        if (publicId) {
            await cloudinary_config_1.default.uploader.destroy(publicId);
        }
    }
    catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        // We don't throw here so that the main delete process continues
        // (e.g. deleting a post should succeed even if the image delete fails)
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
