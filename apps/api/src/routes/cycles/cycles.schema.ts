import { CYCLE_NAME_MAX } from '@/constants/cycle.constant.js';
import { z } from '@/openapi/zod.js';

export const createCycleBodySchema = z.object({
  name: z.string().trim().min(1).max(CYCLE_NAME_MAX),
  startsAt: z.string().trim().min(1),
  endsAt: z.string().trim().min(1),
  status: z.string().trim().min(1).optional(),
});

export const patchCycleBodySchema = z.object({
  name: z.string().trim().min(1).max(CYCLE_NAME_MAX).optional(),
  startsAt: z.string().trim().min(1).optional(),
  endsAt: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
});
