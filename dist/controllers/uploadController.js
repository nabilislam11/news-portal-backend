"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const createError_1 = require("../utils/createError");
const cloudinary_1 = require("../utils/cloudinary");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.uploadImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // 1. Grab the file array (Multer puts files here when using upload.any())
    const files = req.files;
    // 2. Check if the array exists and has at least one file
    if (!files || files.length === 0) {
        throw (0, createError_1.createError)("No image file provided", 400);
    }
    // 3. Select the first file (Treat it as your "single object")
    const file = files[0];
    // 4. Upload using the helper
    const result = await (0, cloudinary_1.uploadToCloudinary)(file.path, "news-posts");
    res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: result,
    });
});
