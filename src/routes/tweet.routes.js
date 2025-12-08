import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getAllTweets,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { tweetValidationSchema } from "../validators/tweet.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/create-tweet")
  .post(validate(tweetValidationSchema), verifyJWT, createTweet);

router.route("/user-tweets/:userId").get(verifyJWT, getUserTweets);
router
  .route("/update-tweet/:tweetId")
  .put(verifyJWT, validate(tweetValidationSchema), updateTweet);

router.route("/delete-tweet/:tweetId").delete(verifyJWT, deleteTweet);

router.route("/all-tweets").get(verifyJWT, getAllTweets);
export default router;
