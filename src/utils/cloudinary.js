import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import Logger from "./logger.js";

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECERET,
});

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  let response = null;
  try {
    response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
  } catch (error) {
    Logger.error(`Cloudinary upload failed: ${error.message}`);
    response = null;
  } finally {
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (unlinkError) {
      Logger.warn(
        `Failed to delete local file ${localFilePath}: ${unlinkError.message}`
      );
    }
  }

  return response;
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    Logger.error(`Error deleting from cloudinary: ${error}`);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
