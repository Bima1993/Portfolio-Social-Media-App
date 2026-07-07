import { z } from "zod";

export const createPostSchema = z.object({
  caption: z.string().trim().min(1, "Caption is required.").max(1200, "Caption must be 1200 characters or fewer."),
});

export type CreatePostFormValues = z.infer<typeof createPostSchema>;
