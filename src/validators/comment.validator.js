import { body } from "express-validator";

const commentValidator = () => {
  return [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Comment content is required"),
  ];
};

export { commentValidator };
