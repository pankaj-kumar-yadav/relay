import { z } from '@/openapi/zod.js';

export const userNameSchema = z.string().trim().min(1);

export const registerBodySchema = z.object({
  name: userNameSchema,
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const patchMeBodySchema = z.object({
  name: userNameSchema,
});

export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  isSuperAdmin: z.boolean(),
});
