import { uploadOnCloudinary, deleteFromCloudinary } from "./cloudinary.js";
import { ApiError } from "./ApiError.js";
import Logger from "./logger.js";

export const updateMedia = async ({
  model, // Mongoose model (User, Video, etc.)
  docId, // Document ID
  filePath, // req.file.path
  field, // e.g., "thumbnail"
  publicIdField, // e.g., "thumbnailPublicId"
  notFoundMessage = "File is required",
  selectFields = "", // optional fields to select
}) => {
  if (!filePath) {
    throw new ApiError(400, notFoundMessage);
  }

  // Step 1: Upload new file
  let newFile;
  try {
    newFile = await uploadOnCloudinary(filePath);
    if (!newFile) throw new Error("Cloudinary upload returned null");
    Logger.info(`${field} uploaded: ${newFile.public_id}`);
  } catch (err) {
    Logger.error(`Upload error for ${field}: ${err.message}`);
    throw new ApiError(500, `Failed to upload ${field}`);
  }

  // Step 2: Fetch previous document to get old public ID
  const prevDoc = await model.findById(docId).select(publicIdField);
  if (!prevDoc) {
    throw new ApiError(404, `${model.modelName} not found`);
  }

  const oldPublicId = prevDoc[publicIdField];

  // Step 3: Update document
  const updateData = {
    [field]: newFile.url || newFile.secure_url,
    [publicIdField]: newFile.public_id,
  };

  const updatedDoc = await model.findByIdAndUpdate(
    docId,
    { $set: updateData },
    { new: true }
  );

  // Step 4: Delete old one
  try {
    if (oldPublicId && oldPublicId !== newFile.public_id) {
      await deleteFromCloudinary(oldPublicId);
    }
  } catch (err) {
    Logger.warn(`Failed to delete old ${field}: ${err.message}`);
  }

  return updatedDoc;
};
