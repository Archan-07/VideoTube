// middlewares/zod.middleware.js
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import multer from "multer";

export const validate = (schema) => (req, res, next) => {
  try {
    const dataToValidate = { ...req.body };

    // 1. upload.fields([...]) / upload.array()
    // 🔥 FIX: Check if req.files exists and is an object
    if (
      req.files &&
      typeof req.files === "object" &&
      Object.keys(req.files).length > 0
    ) {
      for (const key of Object.keys(req.files)) {
        // multer gives arrays for fields()
        dataToValidate[key] = req.files[key];
      }
    }

    // 👇 Always ensure array file fields exist (even if empty)
    const arrayFileFields = ["avatar", "coverImage", "thumbnail", "videoFile"];

    for (const field of arrayFileFields) {
      if (dataToValidate[field] === undefined) {
        dataToValidate[field] = [];
      }
    }

    // 2. upload.single()
    if (req.file) {
      dataToValidate[req.file.fieldname] = req.file;
    }

    schema.parse(dataToValidate);
    next();
  } catch (err) {
    console.error("Validation Error:-------------", err);
    if (
      err instanceof multer.MulterError ||
      err.message === "Unexpected end of form"
    ) {
      return res.status(400).json({
        success: false,
        message: "File Upload Error",
        errors: [{ message: err.message }],
      });
    }
    if (err instanceof z.ZodError) {
      const list = Array.isArray(err.issues)
        ? err.issues
        : Array.isArray(err.errors)
          ? err.errors
          : [];

      const errors = list.map((e) => ({
        field: e.path?.[0] ?? "unknown",
        message: e.message,
      }));

      return res
        .status(400)
        .json(new ApiError(400, "Validation Error", errors));
    }

    if (
      err.name === "MulterError" ||
      err.message === "Unexpected end of form"
    ) {
      return res
        .status(400)
        .json(
          new ApiError(400, "File Upload Error", [{ message: err.message }])
        );
    }

    next(err);
  }
};
