import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, { message: 'Display name must be at least 2 characters.' })
      .max(24, { message: 'Display name must be at most 24 characters.' }),
    email: z
      .string()
      .min(1, { message: 'Email is required.' })
      .email({ message: 'Please enter a valid email address.' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' })
      .regex(/(?=.*[0-9])/, { message: 'Password must contain at least 1 number.' }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const guestSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: 'Display name must be at least 2 characters.' })
    .max(24, { message: 'Display name must be at most 24 characters.' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GuestInput = z.infer<typeof guestSchema>;
