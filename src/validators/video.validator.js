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

const publishAVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  thumbnail: z
    .array(imageSchema)
    .min(1, { message: "Thumbnail is required" })
    .max(1, { message: "Only one thumbnail allowed" }),

  // Multer -> videoFile: [file]
  videoFile: z.array(z.any()).min(1, { message: "Video file is required" }),
});

const updateVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  thumbnail: z
    .array(imageSchema)
    .max(1, { message: "Only one thumbnail allowed" }),
});

export { publishAVideoSchema, updateVideoSchema };
