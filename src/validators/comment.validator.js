import { body } from "express-validator";

const commentValidator = () => {
  return [
    // Content
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Comment content is required"),
  ];
};

export { commentValidator };
