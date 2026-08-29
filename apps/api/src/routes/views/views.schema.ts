import { VIEW_NAME_MAX } from '@/constants/view.constant.js';
import { z } from '@/openapi/zod.js';

const optionalTrimmed = z.string().trim().min(1);

export const viewFiltersSchema = z
  .object({
    teamId: optionalTrimmed.optional(),
    status: optionalTrimmed.optional(),
    priority: optionalTrimmed.optional(),
    assigneeId: optionalTrimmed.optional(),
    projectId: z.string().uuid().optional(),
    q: optionalTrimmed.optional(),
    statusCategory: optionalTrimmed.optional(),
    cycleId: z.string().uuid().optional(),
    labelId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.assigneeId === 'me') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'assigneeId cannot be "me" in a saved view',
        path: ['assigneeId'],
      });
    }
  });

export type ViewFilters = z.infer<typeof viewFiltersSchema>;

export const createViewBodySchema = z.object({
  name: z.string().trim().min(1).max(VIEW_NAME_MAX),
  filters: viewFiltersSchema.optional(),
});

export const patchViewBodySchema = z.object({
  name: z.string().trim().min(1).max(VIEW_NAME_MAX).optional(),
  filters: viewFiltersSchema.optional(),
});
