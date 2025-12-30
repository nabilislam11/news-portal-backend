"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromBreakingNews = exports.getBreakingNews = exports.getPostsByFilter = exports.getTrendingPosts = exports.searchPosts = exports.getAllPosts = exports.getPostById = exports.deletePost = exports.updatePost = exports.createPost = void 0;
const mongoose_1 = require("mongoose");
const fs_1 = __importDefault(require("fs"));
const postSchema_1 = require("../models/postSchema");
const tagSchema_1 = require("../models/tagSchema");
const postViewSchema_1 = require("../models/postViewSchema");
const breakingNewsSchema_1 = require("../models/breakingNewsSchema");
const cloudinary_1 = require("../utils/cloudinary");
const createError_1 = require("../utils/createError");
const categorySchema_1 = __importDefault(require("../models/categorySchema"));
const asyncHandler_1 = require("../utils/asyncHandler");
// ==========================================
// INTERNAL HELPER: Add to Breaking News List
// ==========================================
const addToBreakingNewsList = async (postId) => {
    let breaking = await breakingNewsSchema_1.BreakingNews.findOne();
    if (!breaking) {
        breaking = await breakingNewsSchema_1.BreakingNews.create({ posts: [] });
    }
    const currentList = breaking.posts.map((p) => p.toString());
    const newId = postId.toString();
    const filteredList = currentList.filter((id) => id !== newId);
    filteredList.unshift(newId);
    const finalList = filteredList.slice(0, 5);
    breaking.posts = finalList;
    await breaking.save();
};
// ==========================================
// OTHER HELPERS
// ==========================================
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
        updateOne: { filter: { name }, update: { $set: { name } }, upsert: true },
    }));
    if (bulkOps.length > 0)
        await tagSchema_1.Tag.bulkWrite(bulkOps);
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
    const { title, content, category, tags, addToBreaking } = req.body;
    const file = getFile(req);
    if (!title || !content || !category) {
        if (file)
            safeDelete(file.path);
        throw (0, createError_1.createError)("Required fields missing", 400);
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
    const imageData = await (0, cloudinary_1.uploadToCloudinary)(file.path, "news-posts");
    if (file)
        safeDelete(file.path);
    try {
        const tagIds = await processTags(tags);
        const post = new postSchema_1.Post({
            title,
            content,
            image: imageData,
            category,
            tags: tagIds,
        });
        await post.save();
        if (addToBreaking === "true" || addToBreaking === true) {
            await addToBreakingNewsList(post._id);
        }
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
    const { title, content, category, tags, addToBreaking } = req.body;
    const file = getFile(req);
    const oldPost = await postSchema_1.Post.findById(postId);
    if (!oldPost) {
        if (file)
            safeDelete(file.path);
        throw (0, createError_1.createError)("Post not found", 404);
    }
    const updateData = {};
    if (title) {
        if (title.length < 10)
            throw (0, createError_1.createError)("Title must be 10+ chars", 400);
        updateData.title = title;
    }
    if (content)
        updateData.content = content;
    if (category) {
        const categoryExists = await categorySchema_1.default.findById(category);
        if (!categoryExists)
            throw (0, createError_1.createError)("Invalid Category", 400);
        updateData.category = category;
    }
    if (tags)
        updateData.tags = await processTags(tags);
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
            .populate("tags", "name");
        if (addToBreaking === "true" || addToBreaking === true) {
            if (updatedPost)
                await addToBreakingNewsList(updatedPost._id);
        }
        if (newImageUploaded && oldPost.image?.publicId) {
            await (0, cloudinary_1.deleteFromCloudinary)(oldPost.image.publicId);
        }
        res.status(200).json({ success: true, message: "Post updated", data: updatedPost });
    }
    catch (error) {
        if (newImageUploaded && imageData.publicId)
            await (0, cloudinary_1.deleteFromCloudinary)(imageData.publicId);
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
    if (post.image?.publicId)
        await (0, cloudinary_1.deleteFromCloudinary)(post.image.publicId);
    await postSchema_1.Post.findByIdAndDelete(postId);
    res.status(200).json({ success: true, message: "Post deleted" });
});
// 4. Get Post By ID
exports.getPostById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const post = await postSchema_1.Post.findById(req.params.postId).populate("category tags");
    if (!post)
        throw (0, createError_1.createError)("Post not found", 404);
    res.status(200).json({ success: true, data: post });
});
// 5. Get All Posts (NO PAGINATION)
exports.getAllPosts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const posts = await postSchema_1.Post.find().sort({ createdAt: -1 }).populate("category tags");
    res.status(200).json({ success: true, count: posts.length, data: posts });
});
// 6. Search Posts (NO PAGINATION)
exports.searchPosts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { query, categoryName } = req.query;
    const searchFilter = {};
    if (query)
        searchFilter.$text = { $search: query };
    if (categoryName) {
        const safeCat = escapeRegex(categoryName);
        const category = await categorySchema_1.default.findOne({ name: { $regex: safeCat, $options: "i" } });
        if (category)
            searchFilter.category = category._id;
        else
            return res.status(200).json({ success: true, data: [] });
    }
    let postsQuery = postSchema_1.Post.find(searchFilter);
    if (query)
        postsQuery = postsQuery.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
    else
        postsQuery = postsQuery.sort({ createdAt: -1 });
    const posts = await postsQuery.populate("category tags");
    res.status(200).json({
        success: true,
        data: posts,
    });
});
// 7. Get Trending Posts
exports.getTrendingPosts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let finalPosts = [];
    let collectedIds = [];
    const fetchTrending = async (startTime, excludeIds, limit) => {
        return postViewSchema_1.PostView.aggregate([
            { $match: { createdAt: { $gte: startTime }, post: { $nin: excludeIds } } },
            { $group: { _id: "$post", viewCount: { $sum: 1 } } },
            { $sort: { viewCount: -1 } },
            { $limit: limit },
            { $lookup: { from: "posts", localField: "_id", foreignField: "_id", as: "postDetails" } },
            { $unwind: "$postDetails" },
            {
                $lookup: { from: "categories", localField: "postDetails.category", foreignField: "_id", as: "categoryDetails" },
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
                    category: { name: "$categoryDetails.name", slug: "$categoryDetails.slug" },
                },
            },
        ]);
    };
    const trending24h = await fetchTrending(twentyFourHoursAgo, [], 3);
    finalPosts = [...trending24h];
    collectedIds = finalPosts.map((p) => p._id);
    if (finalPosts.length < 3) {
        const trending7d = await fetchTrending(sevenDaysAgo, collectedIds, 3 - finalPosts.length);
        finalPosts = [...finalPosts, ...trending7d];
        collectedIds = finalPosts.map((p) => p._id);
    }
    if (finalPosts.length < 3) {
        const fallbackPosts = await postSchema_1.Post.find({ _id: { $nin: collectedIds } })
            .sort({ createdAt: -1 })
            .limit(3 - finalPosts.length)
            .populate("category", "name slug");
        finalPosts = [
            ...finalPosts,
            ...fallbackPosts.map((p) => ({
                _id: p._id,
                viewCount: 0,
                postDetails: { title: p.title, image: p.image, createdAt: p.createdAt, slug: p.slug },
                category: { name: p.category?.name, slug: p.category?.slug },
            })),
        ];
    }
    res.status(200).json({ success: true, data: finalPosts });
});
// 8. Get Posts by Filter (NO PAGINATION)
exports.getPostsByFilter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    let filter = {};
    let filterType = "all";
    let filterName = "All Posts";
    if (id !== "all") {
        if (!mongoose_1.Types.ObjectId.isValid(id))
            throw (0, createError_1.createError)("Invalid ID", 400);
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
            else
                throw (0, createError_1.createError)("Not found", 404);
        }
    }
    const posts = await postSchema_1.Post.find(filter).sort({ createdAt: -1 }).populate("category tags");
    res.status(200).json({
        success: true,
        data: posts,
        meta: { filterType, filterName, filterId: id },
    });
});
// 9. Get Breaking News
exports.getBreakingNews = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const breaking = await breakingNewsSchema_1.BreakingNews.findOne().populate("posts", "title slug image createdAt");
    if (!breaking) {
        return res.status(200).json({ success: true, data: [] });
    }
    res.status(200).json({ success: true, data: breaking.posts });
});
// 10. Remove From Breaking News
exports.removeFromBreakingNews = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const breaking = await breakingNewsSchema_1.BreakingNews.findOne();
    if (!breaking) {
        return res.status(404).json({ success: false, message: "Breaking news list not found" });
    }
    const originalLength = breaking.posts.length;
    breaking.posts = breaking.posts.filter((id) => id.toString() !== postId);
    if (breaking.posts.length !== originalLength) {
        await breaking.save();
    }
    res.status(200).json({ success: true, message: "Removed from Breaking News", data: breaking.posts });
});
