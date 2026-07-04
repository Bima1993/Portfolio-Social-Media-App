import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  bio: z.string().max(160, "Bio must be 160 characters or fewer.").optional(),
  avatarUrl: z.string().url("Enter a valid image URL.").optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
