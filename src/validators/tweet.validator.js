import { body } from "express-validator";

const tweetValidator = () => {
  return [
    body("content")
      .notEmpty()
      .withMessage("Content is required")
      .isString()
      .withMessage("Content must be a string")
      .isLength({ min: 1, max: 280 })
      .withMessage("Content must be between 1 and 280 characters"),
  ];
};

export { tweetValidator };
