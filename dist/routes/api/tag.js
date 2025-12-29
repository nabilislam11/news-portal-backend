"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tagController_1 = require("../../controllers/tagController");
const tagRoutes = express_1.default.Router();
// 1. Get All Tags (Returns tag list with post counts)
// URL: GET /api/tags
tagRoutes.get("/", tagController_1.getAllTags);
// 2. Get Posts by Tag Name
// URL: GET /api/tags/posts?tagName=politics&page=1
tagRoutes.get("/posts", tagController_1.getPostsByTag);
exports.default = tagRoutes;
