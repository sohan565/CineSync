import { z } from 'zod';

// ── Create Room ───────────────────────────────────────────────────────────────

export const createRoomSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'Room name must be at least 3 characters.' })
      .max(50, { message: 'Room name must be at most 50 characters.' })
      .trim(),
    privacy: z.enum(['public', 'unlisted', 'password'], {
      required_error: 'Please select a privacy setting.',
    }),
    permissionMode: z.enum(['open', 'host_only']).default('host_only'),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.privacy === 'password') {
      if (!data.password || data.password.trim().length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must be at least 4 characters.',
          path: ['password'],
        });
      }
      if (data.password && data.password.length > 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must be at most 32 characters.',
          path: ['password'],
        });
      }
    }
  });

// ── Join Room ─────────────────────────────────────────────────────────────────

export const joinRoomSchema = z.object({
  slug: z
    .string()
    .min(6, { message: 'Room code must be at least 6 characters.' })
    .max(12, { message: 'Room code must be at most 12 characters.' })
    .regex(/^[a-zA-Z0-9]+$/, { message: 'Room code can only contain letters and numbers.' })
    .trim(),
  password: z.string().optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
