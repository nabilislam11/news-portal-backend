// 1. Load dotenv FIRST
import dotenv from "dotenv";
dotenv.config();

// 2. Validate Env SECOND
import { validateEnv } from "./utils/validateEnv";
validateEnv();

// 3. Imports
import express from "express";
import routers from "./routes/index";
import { dbConnect } from "./configs/db.config";
import { errorHandler } from "./middleware/errorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 5000;
// Note: Ensure this matches what your frontend calls (e.g., "api/v1")
const BASE_URL = process.env.BASE_URL || "api/v1";

(async () => {
  try {
    app.set("trust proxy", 1);

    app.use(
      cors({
        origin: [
          "https://protidinjonotarnews.com",
          "https://www.protidinjonotarnews.com",
          "http://localhost:5173",
          "https://app.requestly.io",
        ],
        credentials: true,
      })
    );

    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // --- FIX: Ensure the Base URL is actually used ---
    // If your router files don't already include "/api/v1", add it here:
    app.use(`/${BASE_URL}`, routers);
    // OR if your routers already have the prefix, just keep: app.use(routers);

    app.use(errorHandler);

    await dbConnect();

    app.listen(PORT, () =>
      console.log(
        process.env.NODE_ENV === "development"
          ? `✅ Server running - http://localhost:${PORT}/${BASE_URL}`
          : "✅ Server running"
      )
    );
  } catch (error) {
    console.error("Something went wrong:", error);
    process.exit(1);
  }
})();
