"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubscription = exports.getAllSubscriptions = exports.subscribe = void 0;
const subscriptionSchema_1 = require("../models/subscriptionSchema");
const createError_1 = require("../utils/createError");
const asyncHandler_1 = require("../utils/asyncHandler");
// ==========================================
// 1. Subscribe (Public Route)
// ==========================================
exports.subscribe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email)
        throw (0, createError_1.createError)("Email is required", 400);
    // Basic regex validation for email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
        throw (0, createError_1.createError)("Invalid email format", 400);
    const existing = await subscriptionSchema_1.Subscription.findOne({ email });
    if (existing)
        throw (0, createError_1.createError)("This email is already subscribed", 409);
    const newSubscription = await subscriptionSchema_1.Subscription.create({ email });
    res.status(201).json({
        success: true,
        message: "Successfully subscribed to the newsletter",
        data: newSubscription,
    });
});
// ==========================================
// 2. Get All Subscriptions (Admin Route)
// ==========================================
exports.getAllSubscriptions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const subscriptions = await subscriptionSchema_1.Subscription.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await subscriptionSchema_1.Subscription.countDocuments();
    res.status(200).json({
        success: true,
        data: subscriptions,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    });
});
// ==========================================
// 3. Delete Subscription (Admin Route)
// ==========================================
exports.deleteSubscription = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const subscription = await subscriptionSchema_1.Subscription.findByIdAndDelete(id);
    if (!subscription)
        throw (0, createError_1.createError)("Subscription not found", 404);
    res.status(200).json({
        success: true,
        message: "Email removed from list",
    });
});
//# sourceMappingURL=subscriptionController.js.map