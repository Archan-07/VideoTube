import { Router } from "express";
import {
  addToWatchHistory,
  changePassword,
  deleteUserAccount,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loggedOutUser,
  loginUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
} from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {
  changePasswordSchema,
  updateAccountDetailsSchema,
  updateAvatarSchema,
  updatecoverImageSchema,
  userLoginSchema,
  userRegisterSchema,
} from "../validators/user.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Unsecured Routes

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  validate(userRegisterSchema),
  registerUser
);

router.route("/login").post(validate(userLoginSchema), loginUser);
router.route("/refresh-access-token").post(refreshAccessToken);
router.route("/channel/:username").get(getUserChannelProfile);

// Secured Routes
router.route("/logout").post(verifyJWT, loggedOutUser);
router
  .route("/change-password")
  .post(verifyJWT, validate(changePasswordSchema), changePassword);
router.route("/get-current-user").get(verifyJWT, getCurrentUser);
router
  .route("/update-account-details")
  .put(verifyJWT, validate(updateAccountDetailsSchema), updateAccountDetails);
router
  .route("/update-avatar")
  .put(
    verifyJWT,
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    validate(updateAvatarSchema),
    updateAvatar
  );
router
  .route("/update-cover-image")
  .put(
    verifyJWT,
    upload.single("coverImage"),
    validate(updatecoverImageSchema),
    updateCoverImage
  );

router.route("/delete-account").delete(verifyJWT, deleteUserAccount);
router
  .route("/add-to-watch-history/:videoId")
  .post(verifyJWT, addToWatchHistory);
router.route("/get-watch-history").get(verifyJWT, getWatchHistory);
export default router;
