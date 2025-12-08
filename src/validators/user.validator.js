import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const imageSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.enum(ACCEPTED_IMAGE_TYPES, {
    errorMap: () => ({
      message: "Only .jpg, .jpeg, .png and .webp formats are supported.",
    }),
  }),
  size: z.number().max(MAX_FILE_SIZE, { message: "Max file size is 5MB." }),
});

const userRegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email formate" })
    .toLowerCase(),

  fullName: z.string().min(3, "Full Name must be at least 3 characters"),

  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, { message: "Username must be 3-20 characters long" })
    .max(20, { message: "Username must be 3-20 characters long" })
    .regex(/^[a-z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores",
    }),

  password: z
    .string()
    .trim()
    .min(6, { message: "Password must be at least 6 characters" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),

  avatar: z
    .any()
    .refine((files) => files && files?.length >= 1, {
      message: "Avatar image is required",
    })
    .pipe(z.array(imageSchema).max(1, "Only one avatar allowed")),

  coverImage: z
    .array(imageSchema)
    .optional()
    .refine(
      (files) => !files || files.length <= 1,
      "Only one cover image allowed"
    ),
});

const userLoginSchema = z
  .object({
    email: z.string().trim().email().optional(),
    username: z.string().trim().optional(),
    password: z.string().trim().min(1, { message: "Password is required" }),
  })
  .refine((data) => data.email || data.username, {
    message: "Username or Email is required",
    path: ["username"],
  });

const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .trim()
    .min(1, { message: "Old password is required" }),
  newPassword: z
    .string()
    .trim()
    .min(6, { message: "New password must contain at least 6 characters" })
    .regex(/[0-9]/, {
      message: "New password must contain at least one number",
    }),
});

const updateAccountDetailsSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email format" })
    .toLowerCase(),

  fullName: z
    .string()
    .trim()
    .min(3, { message: "Full Name must be at least 3 characters" }),
});

const updateAvatarSchema = z.object({
  avatar: z
    .any()
    .refine((file) => file && file.length > 0, {
      message: "Avatar image is required",
    })
    .pipe(z.array(imageSchema).max(1, "Only one avatar allowed")),
});
const updatecoverImageSchema = z.object({
  coverImage: z
    .any()
    .refine((file) => file && file.length > 0, {
      message: "CoverImage image is required",
    })
    .pipe(z.array(imageSchema).max(1, "Only one coverImage allowed")),
});
export {
  userRegisterSchema,
  userLoginSchema,
  changePasswordSchema,
  updateAccountDetailsSchema,
  updateAvatarSchema,
  updatecoverImageSchema,
};
