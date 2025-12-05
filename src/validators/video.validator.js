import { z } from "zod";

const publishAVideoSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
  }),
});

export { publishAVideoSchema };
