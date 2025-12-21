import mongoose from "mongoose";

export const dbConnect = async (): Promise<void> => {
  const mongoUri = process.env.DB_URL;

  if (!mongoUri) {
    console.error("DB_URL is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};
