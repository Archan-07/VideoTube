import { body } from "express-validator";

const userRegisterValidator = () => {
  return [
    // Email
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),

    // Full Name
    body("fullName")
      .trim()
      .notEmpty()
      .withMessage("Full Name is required")
      .isLength({ min: 3 })
      .withMessage("Full Name must be at least 3 characters"),

    // Username
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be lowercase")
      .matches(/^[a-z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      )
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be 3–20 characters long"),

    // Password
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isStrongPassword({
        minLength: 6,
        minLowercase: 1,
        minUppercase: 0,
        minNumbers: 1,
        minSymbols: 0,
      })
      .withMessage(
        "Password must be at least 6 characters and contain at least one number"
      ),

    // Avatar (optional)
    // body("avatar").custom((value, { req }) => {
    //   const avatar = req.file;
    //   if (!avatar) {
    //     throw new Error("Avatar is required");
    //   }
    //   const allowedFormats = ["image/jpeg", "image/png", "image/gif"];
    //   if (!allowedFormats.includes(avatar.mimetype)) {
    //     throw new Error("Avatar must be a .jpg, .png, or .gif file");
    //   }
    //   if (avatar.size > 5 * 1024 * 1024) {
    //     // 5 MB size limit
    //     throw new Error("Avatar size must be less than 5MB");
    //   }
    //   return true;
    // }),
  ];
};

const userLoginValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("username").trim().notEmpty().withMessage("Username is required"),

    body("password").trim().notEmpty().withMessage("Password is required"),
  ];
};

const changePasswordValidator = () => {
  return [
    body("currentPassword")
      .trim()
      .notEmpty()
      .withMessage("Old password is required"),
    body("newPassword")
      .trim()
      .notEmpty()
      .withMessage("New password is required"),
  ];
};

const updateAccountDetailsValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),

    body("fullName")
      .trim()
      .notEmpty()
      .withMessage("Full Name is required")
      .isLength({ min: 3 })
      .withMessage("Full Name must be at least 3 characters"),
  ];
};

export {
  userRegisterValidator,
  userLoginValidator,
  changePasswordValidator,
  updateAccountDetailsValidator,
};
