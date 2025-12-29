"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthToken = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const createError_1 = require("../utils/createError");
const adminSchema_1 = __importDefault(require("../models/adminSchema")); // <--- Import Admin Model
const verifyAuthToken = async (req, res, next) => {
    try {
        // 2. Runtime Safety Check
        if (!process.env.JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
            return next((0, createError_1.createError)("Internal Server Error: Auth Config Missing", 500));
        }
        const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return next((0, createError_1.createError)("Not authorized. Please login.", 401));
        }
        // 3. Verify Token
        // We cast to 'any' because standard JwtPayload doesn't know about our 'id' field
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // 4. SECURITY FIX: Check if user still exists in DB!
        // This prevents deleted admins from accessing the system using an old token.
        const adminExists = await adminSchema_1.default.findById(decoded.id);
        if (!adminExists) {
            return next((0, createError_1.createError)("Account access revoked. Please contact support.", 403));
        }
        // Attach user to request
        req.admin = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
        };
        next();
    }
    catch (err) {
        // 5. Safer Error Handling
        if (err instanceof jsonwebtoken_1.TokenExpiredError) {
            return next((0, createError_1.createError)("Token expired. Please login again.", 401));
        }
        if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
            return next((0, createError_1.createError)("Invalid token. Authentication failed.", 401));
        }
        // Generic error
        return next((0, createError_1.createError)("Authentication error", 500));
    }
};
exports.verifyAuthToken = verifyAuthToken;
