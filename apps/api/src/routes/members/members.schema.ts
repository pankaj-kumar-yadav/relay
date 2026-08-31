import { OrgRole } from '@/constants/org.js';
import { z } from '@/openapi/zod.js';

export const patchMemberBodySchema = z.object({
  role: z.enum([OrgRole.ADMIN, OrgRole.EMPLOYEE]),
});
