"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postSchema = void 0;
const zod_1 = require("zod");
exports.postSchema = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    title: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    content: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    category: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    image: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
    isDraft: zod_1.z.boolean().optional(),
    views: zod_1.z.number().optional(),
});
