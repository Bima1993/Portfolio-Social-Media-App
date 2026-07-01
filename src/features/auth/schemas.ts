import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only."),
  email: z.email("Enter a valid email address."),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(6, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
