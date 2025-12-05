import { Router } from "express";
import {
  addComment,
  addTweetComment,
  deleteComment,
  deleteTweetComment,
  getTweetComments,
  getVideoComments,
  updateComment,
  updateTweetComment,
} from "../controllers/comment.controller.js";
import { commentValidator } from "../validators/comment.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// Routes for Video Comments
router.route("/get-comments-by-video/:videoId").get(getVideoComments);
router
  .route("/add-comment/:videoId")
  .post(commentValidator(), validate, verifyJWT, addComment);

router
  .route("/update-comment/:commentId")
  .put(commentValidator(), validate, verifyJWT, updateComment);

router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment);

// Routes for Tweet Comments
router.route("/get-comments-by-tweet/:tweetId").get(getTweetComments);
router
  .route("/add-tweet-comment/:tweetId")
  .post(commentValidator(), validate, verifyJWT, addTweetComment);

router
  .route("/update-tweet-comment/:commentId")
  .put(commentValidator(), validate, verifyJWT, updateTweetComment);

router
  .route("/delete-tweet-comment/:commentId")
  .delete(verifyJWT, deleteTweetComment);

export default router;
