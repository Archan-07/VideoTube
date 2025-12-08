import z from "zod";

const plyalistValidationSchema = z.object({
  name: z
    .string()
    .min(3, "Playlist name must be at least 3 characters")
    .max(20, "Playlist name can be up to 20 characters long"),

  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(300, "Description can be up to 300 characters long"),
});

export { plyalistValidationSchema };
