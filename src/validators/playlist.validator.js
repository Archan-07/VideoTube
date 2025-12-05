import { body } from "express-validator";

const playlistValidator = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Playlist name is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("Playlist name must be between 3 and 50 characters"),

    body("description")
      .optional()
      .isLength({ max: 300 })
      .withMessage("Description can be up to 300 characters long"),
  ];
};

export { playlistValidator };
