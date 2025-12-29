"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostsByFilter = exports.getTrendingPosts = exports.searchPosts = exports.getAllPosts = exports.getPostById = exports.deletePost = exports.updatePost = exports.createPost = void 0;
const mongoose_1 = require("mongoose");
const fs_1 = __importDefault(require("fs"));
const postSchema_1 = require("../models/postSchema");
const tagSchema_1 = require("../models/tagSchema");
const postViewSchema_1 = require("../models/postViewSchema");
const cloudinary_1 = require("../utils/cloudinary");
const createError_1 = require("../utils/createError");
const categorySchema_1 = __importDefault(require("../models/categorySchema"));
const asyncHandler_1 = require("../utils/asyncHandler");
// ==========================================
// HELPERS
// ==========================================
// Helper: Non-blocking file deletion
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
// Process Tags (Optimized BulkWrite)
const processTags = async (tags) => {
    if (!tags)
        return [];
    let tagList = [];
    if (Array.isArray(tags)) {
        tagList = tags;
    }
    else if (typeof tags === "string") {
        try {
            const parsed = JSON.parse(tags);
            tagList = Array.isArray(parsed) ? parsed : [tags];
        }
        catch (error) {
            tagList = tags.split(",");
        }
    }
    const uniqueNames = [...new Set(tagList.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0))];
    if (uniqueNames.length === 0)
        return [];
    const bulkOps = uniqueNames.map((name) => ({
        updateOne: {
            filter: { name },
            update: { $set: { name } },
            upsert: true,
        },
    }));
    if (bulkOps.length > 0) {
        await tagSchema_1.Tag.bulkWrite(bulkOps);
    }
    const foundTags = await tagSchema_1.Tag.find({ name: { $in: uniqueNames } }).select("_id");
    return foundTags.map((tag) => tag._id);
};
const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
// ==========================================
// CONTROLLERS
// ==========================================
// 1. Create Post
exports.createPost = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { title, content, category, subCategory, tags, isFavourite } = req.body;
    const file = getFile(req);
    // --- VALIDATION ---
    if (!title || !content || !category) {
        if (file)
            safeDelete(file.path);
        throw (0, createError_1.createError)("Required fields missing: title, content, category", 400);
    }
    if (title.length < 10) {
        if (file)
            safeDelete(file.path);
        throw (0, createError_1.createError)("Title must be at least 10 characters long", 400);
    }
    if (!file)
        throw (0, createError_1.createError)("Image file is required", 400);
    const categoryExists = await categorySchema_1.default.findById(category);
    if (!categoryExists) {
        if (file)
            safeDelete(file.path);
        throw (0, createError_1.createError)("Invalid Category ID", 400);
    }
    // --- UPLOAD ---
    const imageData = await (0, cloudinary_1.uploadToCloudinary)(file.path, "news-posts");
    if (file)
        safeDelete(file.path);
    try {
        const tagIds = await processTags(tags);
        let cleanSubCategory = subCategory;
        if (!subCategory || subCategory === "null" || subCategory === "undefined" || subCategory === "") {
            cleanSubCategory = null;
        }
        const post = new postSchema_1.Post({
            title,
            content,
            image: imageData,
            category,
            subCategory: cleanSubCategory,
            tags: tagIds,
            isFavourite: isFavourite === "true" || isFavourite === true,
        });
        await post.save();
        res.status(201).json({ success: true, message: "Post created", data: post });
    }
    catch (error) {
        await (0, cloudinary_1.deleteFromCloudinary)(imageData.publicId);
        throw error;
    }
});
// 2. Update Post
exports.updatePost = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const { title, content, category, subCategory, tags, isFavourite } = req.body;
    const file = getFile(req);
    const oldPost = await postSchema_1.Post.findById(postId);
    if (!oldPost) {
        if (file)
            safeDelete(file.path);
        throw (0, createError_1.createError)("Post not found", 404);
    }
    const updateData = {};
    if (title) {
        if (title.length < 10) {
            if (file)
                safeDelete(file.path);
            throw (0, createError_1.createError)("Title must be at least 10 characters long", 400);
        }
        updateData.title = title;
    }
    if (content)
        updateData.content = content;
    if (category) {
        const categoryExists = await categorySchema_1.default.findById(category);
        if (!categoryExists) {
            if (file)
                safeDelete(file.path);
            throw (0, createError_1.createError)("Invalid Category ID", 400);
        }
        updateData.category = category;
    }
    if (subCategory !== undefined) {
        if (subCategory === "null" || subCategory === "undefined" || subCategory === "") {
            updateData.subCategory = null;
        }
        else {
            updateData.subCategory = subCategory;
        }
    }
    if (tags) {
        updateData.tags = await processTags(tags);
    }
    if (isFavourite !== undefined) {
        updateData.isFavourite = isFavourite === "true" || isFavourite === true;
    }
    let imageData = oldPost.image;
    let newImageUploaded = false;
    try {
        if (file) {
            imageData = await (0, cloudinary_1.uploadToCloudinary)(file.path, "news-posts");
            newImageUploaded = true;
            updateData.image = imageData;
            if (file)
                safeDelete(file.path);
        }
        const updatedPost = await postSchema_1.Post.findByIdAndUpdate(postId, updateData, { new: true, runValidators: true })
            .populate("category", "name slug")
            .populate("subCategory", "name slug")
            .populate("tags", "name");
        if (newImageUploaded && oldPost.image?.publicId) {
            await (0, cloudinary_1.deleteFromCloudinary)(oldPost.image.publicId);
        }
        res.status(200).json({ success: true, message: "Post updated", data: updatedPost });
    }
    catch (error) {
        if (newImageUploaded && imageData.publicId) {
            await (0, cloudinary_1.deleteFromCloudinary)(imageData.publicId);
        }
        if (file)
            safeDelete(file.path);
        throw error;
    }
});
// 3. Delete Post
exports.deletePost = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const post = await postSchema_1.Post.findById(postId);
    if (!post)
        throw (0, createError_1.createError)("Post not found", 404);
    if (post.image?.publicId) {
        await (0, cloudinary_1.deleteFromCloudinary)(post.image.publicId);
    }
    await postSchema_1.Post.findByIdAndDelete(postId);
    res.status(200).json({ success: true, message: "Post deleted successfully" });
});
// 4. Get Post By ID
exports.getPostById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const post = await postSchema_1.Post.findById(req.params.postId)
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("tags", "name");
    if (!post)
        throw (0, createError_1.createError)("Post not found", 404);
    res.status(200).json({ success: true, data: post });
});
// 5. Get All Posts (Feed)
exports.getAllPosts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const posts = await postSchema_1.Post.find()
        .sort({ createdAt: -1 })
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("tags", "name");
    res.status(200).json({
        success: true,
        count: posts.length,
        data: posts,
    });
});
// 6. Search Posts (Optimized)
exports.searchPosts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { query, categoryName } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchFilter = {};
    if (query) {
        searchFilter.$text = { $search: query };
    }
    if (categoryName) {
        const safeCat = escapeRegex(categoryName);
        const category = await categorySchema_1.default.findOne({
            name: { $regex: safeCat, $options: "i" },
        });
        if (category) {
            searchFilter.category = category._id;
        }
        else {
            return res.status(200).json({
                success: true,
                data: [],
                pagination: { total: 0, page, limit, pages: 0 },
            });
        }
    }
    let postsQuery = postSchema_1.Post.find(searchFilter);
    if (query) {
        postsQuery = postsQuery.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
    }
    else {
        postsQuery = postsQuery.sort({ createdAt: -1 });
    }
    const posts = await postsQuery.skip(skip).limit(limit).populate("category", "name slug").populate("tags", "name");
    const total = await postSchema_1.Post.countDocuments(searchFilter);
    res.status(200).json({
        success: true,
        data: posts,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
});
// 7. Get Trending Posts (Cascading: 24h -> 7 Days -> Latest)
// UPDATED: Now fetches exactly 3 posts max.
exports.getTrendingPosts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let finalPosts = [];
    let collectedIds = [];
    const fetchTrending = async (startTime, excludeIds, limit) => {
        return postViewSchema_1.PostView.aggregate([
            {
                $match: {
                    createdAt: { $gte: startTime },
                    post: { $nin: excludeIds },
                },
            },
            { $group: { _id: "$post", viewCount: { $sum: 1 } } },
            { $sort: { viewCount: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "posts",
                    localField: "_id",
                    foreignField: "_id",
                    as: "postDetails",
                },
            },
            { $unwind: "$postDetails" },
            {
                $lookup: {
                    from: "categories",
                    localField: "postDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    viewCount: 1,
                    "postDetails.title": 1,
                    "postDetails.image": 1,
                    "postDetails.createdAt": 1,
                    "postDetails.slug": 1,
                    category: {
                        name: "$categoryDetails.name",
                        slug: "$categoryDetails.slug",
                    },
                },
            },
        ]);
    };
    // STEP 1: 24h (Try to get 3)
    const trending24h = await fetchTrending(twentyFourHoursAgo, [], 3);
    finalPosts = [...trending24h];
    collectedIds = finalPosts.map((p) => p._id);
    // STEP 2: 7 Days (Fill remaining if < 3)
    if (finalPosts.length < 3) {
        const needed = 3 - finalPosts.length;
        const trending7d = await fetchTrending(sevenDaysAgo, collectedIds, needed);
        finalPosts = [...finalPosts, ...trending7d];
        collectedIds = finalPosts.map((p) => p._id);
    }
    // STEP 3: Fallback (Fill remaining if < 3)
    if (finalPosts.length < 3) {
        const needed = 3 - finalPosts.length;
        const fallbackPosts = await postSchema_1.Post.find({
            _id: { $nin: collectedIds },
        })
            .sort({ createdAt: -1 })
            .limit(needed)
            .populate("category", "name slug");
        const formattedFallback = fallbackPosts.map((post) => ({
            _id: post._id,
            viewCount: 0,
            postDetails: {
                title: post.title,
                image: post.image,
                createdAt: post.createdAt,
                slug: post.slug,
            },
            category: {
                name: post.category?.name || "Uncategorized",
                slug: post.category?.slug || "",
            },
        }));
        finalPosts = [...finalPosts, ...formattedFallback];
    }
    res.status(200).json({ success: true, data: finalPosts });
});
// 8. Get Posts by Filter (Smart Endpoint)
exports.getPostsByFilter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let filter = {};
    let filterType = "all";
    let filterName = "All Posts";
    if (id === "all") {
        // Keep defaults
    }
    else {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw (0, createError_1.createError)("Invalid ID format. Must be a valid MongoDB ObjectId or 'all'.", 400);
        }
        const category = await categorySchema_1.default.findById(id);
        if (category) {
            filter.category = category._id;
            filterType = "category";
            filterName = category.name;
        }
        else {
            const tag = await tagSchema_1.Tag.findById(id);
            if (tag) {
                filter.tags = tag._id;
                filterType = "tag";
                filterName = tag.name;
            }
            else {
                throw (0, createError_1.createError)("No Category or Tag found with this ID", 404);
            }
        }
    }
    const posts = await postSchema_1.Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("tags", "name");
    const total = await postSchema_1.Post.countDocuments(filter);
    res.status(200).json({
        success: true,
        data: posts,
        meta: {
            filterType,
            filterName,
            filterId: id,
        },
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
});
