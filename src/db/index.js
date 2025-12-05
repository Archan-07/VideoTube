import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import Logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`,
      {
        // ADD THIS LINE:
        maxPoolSize: 50, // Only allow 50 open connections to DB at once
        // This forces the 1000 users to queue up and share these 50 connections
      }
    );
    Logger.info(
      `MongoDB connected ! DB host : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    Logger.error(`MongoDB connection error: ${error}`);
    process.exit(1);
  }
};

export { connectDB };
