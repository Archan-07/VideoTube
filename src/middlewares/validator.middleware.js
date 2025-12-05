import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";
import Logger from "../utils/logger.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  // --- ADD THIS LINE TO DEBUG ---
  Logger.warn(
    `❌ Validation Failed: ${JSON.stringify(errors.array(), null, 2)}`
  );
  // ------------------------------
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

  return next(
    new ApiError(422, "Received data is not valid!", extractedErrors)
  );
};
