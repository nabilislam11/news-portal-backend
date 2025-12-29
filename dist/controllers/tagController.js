"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostsByTag = exports.getAllTags = void 0;
const tagSchema_1 = require("../models/tagSchema");
const postSchema_1 = require("../models/postSchema");
const createError_1 = require("../utils/createError");
const asyncHandler_1 = require("../utils/asyncHandler");
// 1. Get All Tags (Optimized: No more N+1 Query Loop)
exports.getAllTags = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // A. Aggregation: Group posts by tag and count them in ONE database operation
    const tagCounts = await postSchema_1.Post.aggregate([
        { $unwind: "$tags" }, // Deconstructs the tags array field
        { $group: { _id: "$tags", count: { $sum: 1 } } }, // Groups by Tag ID and sums them up
    ]);
    // B. Create a Map for O(1) instant lookup
    // Key: Tag ID (string), Value: Count (number)
    const countMap = new Map(tagCounts.map((t) => [t._id.toString(), t.count]));
    // C. Fetch all tags (1 Query)
    const tags = await tagSchema_1.Tag.find().sort({ createdAt: -1 });
    // D. Merge the counts in memory (Fast)
    const tagsWithCount = tags.map((tag) => ({
        _id: tag._id,
        name: tag.name,
        postCount: countMap.get(tag._id.toString()) || 0,
    }));
    res.status(200).json({ success: true, data: tagsWithCount });
});
// 2. Get Single Tag (Find tag -> Find posts with that tag)
exports.getPostsByTag = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { tagName } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    if (!tagName)
        throw (0, createError_1.createError)("Tag name is required", 400);
    const tag = await tagSchema_1.Tag.findOne({ name: tagName.toLowerCase().trim() });
    if (!tag) {
        return res.status(200).json({
            success: true,
            tagName: tagName,
            data: [],
            pagination: { total: 0, page, limit, pages: 0 },
        });
    }
    // Find posts where the 'tags' array contains this tag._id
    const posts = await postSchema_1.Post.find({ tags: tag._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug")
        .populate("tags", "name");
    const total = await postSchema_1.Post.countDocuments({ tags: tag._id });
    res.status(200).json({
        success: true,
        tagName: tag.name,
        data: posts,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
});
