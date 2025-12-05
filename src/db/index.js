import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import Logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`,
      {
        maxPoolSize: 50,
      }
    );
  } catch (error) {
    Logger.error(`MongoDB connection error: ${error}`);
    process.exit(1);
  }
};

export { connectDB };
