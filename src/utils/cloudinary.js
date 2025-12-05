import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import Logger from "./logger.js";
// configure cloudinary

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECERET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    Logger.info(`✅File uploaded on cloudinary, File src : ${response.url}`);

    //once the file is uploaded, we would like to delete it from our server

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    Logger.info(`Deleted from cloudinary: ${result}`);
  } catch (error) {
    Logger.error(`Error deleting from cloudinary: ${error}`);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
