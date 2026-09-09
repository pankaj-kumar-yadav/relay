import { OrgRole } from '@relay/shared/constants/org.constant';
import { z } from '@/openapi/zod.js';

export const patchMemberBodySchema = z.object({
  role: z.enum([OrgRole.ADMIN, OrgRole.EMPLOYEE]),
});
