import { Router } from "express";
import {
  addComment,
  addNestedComment,
  addTweetComment,
  deleteComment,
  deleteTweetComment,
  getNestedComment,
  getTweetComments,
  getVideoComments,
  updateComment,
  updateTweetComment,
} from "../controllers/comment.controller.js";
import { commentValidationSchema } from "../validators/comment.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// Routes for Video Comments
router.route("/get-comments-by-video/:videoId").get(getVideoComments);
router
  .route("/add-comment/:videoId")
  .post(verifyJWT, validate(commentValidationSchema), addComment);

router
  .route("/update-comment/:commentId")
  .put(verifyJWT, validate(commentValidationSchema), updateComment);

router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment);

// Routes for Tweet Comments
router.route("/get-comments-by-tweet/:tweetId").get(getTweetComments);
router
  .route("/add-tweet-comment/:tweetId")
  .post(verifyJWT, validate(commentValidationSchema), addTweetComment);

router
  .route("/update-tweet-comment/:commentId")
  .put(verifyJWT, validate(commentValidationSchema), updateTweetComment);

router
  .route("/delete-tweet-comment/:commentId")
  .delete(verifyJWT, deleteTweetComment);

router
  .route("/add-nested-comment/:commentId")
  .post(verifyJWT, validate(commentValidationSchema), addNestedComment);
router.route("/get-nested-comment-by-parentCommentId/:commentId").get(getNestedComment);


export default router;
