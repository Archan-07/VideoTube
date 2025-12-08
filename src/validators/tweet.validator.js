import z from "zod";

const tweetValidationSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(280, "Content must be between 1 and 280 characters"),
});

export { tweetValidationSchema };
