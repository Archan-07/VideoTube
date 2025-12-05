import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import Logger from "../utils/logger.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request: No token provided");
  }

  try {
    // Verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken?._id) {
      throw new ApiError(401, "Unauthorized request: Invalid token structure");
    }

    // Fetch the user based on the decoded token's _id
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized: User not found");
    }

    // Attach user object to request for further use
    req.user = user;
    next();
  } catch (error) {
    Logger.error(`JWT verification error: ${error}`); // Optional: for debugging
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
