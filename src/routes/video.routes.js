import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getTrendingVideos,
  getUserVideos,
  getVideoById,
  publishAVideo,
  searchVideos,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import {
  publishAVideoSchema,
  updateVideoSchema,
} from "../validators/video.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();
router.route("/publish-video").post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  validate(publishAVideoSchema),
  publishAVideo
);

router.route("/").get(getAllVideos);
router.route("/get-video-by-id/:videoId").get(verifyJWT, getVideoById);
router
  .route("/update-video/:videoId")
  .put(
    verifyJWT,
    upload.single("thumbnail"),
    validate(updateVideoSchema),
    updateVideo
  );

router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);
router
  .route("/toggle-publish-status/:videoId")
  .patch(verifyJWT, togglePublishStatus);

router.route("/get-user-videos/:userId").get(verifyJWT, getUserVideos);

router.route("/trending").get(getTrendingVideos);

router.route("/search/query").get(searchVideos);

export default router;
