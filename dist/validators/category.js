"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorySchema = void 0;
const zod_1 = require("zod");
exports.categorySchema = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    description: zod_1.z.string().optional(),
});
//# sourceMappingURL=category.js.map