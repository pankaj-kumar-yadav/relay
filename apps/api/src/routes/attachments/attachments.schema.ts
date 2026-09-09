import { z } from '@/openapi/zod.js';

import { ATTACHMENT_FILE_NAME_MAX } from '@relay/shared/constants/attachment.constant';

export const intentBodySchema = z.object({
  contentType: z.string().trim().min(1),
  byteSize: z.number().int().positive(),
  fileName: z.string().trim().min(1).max(ATTACHMENT_FILE_NAME_MAX),
});

export const completeAvatarBodySchema = z.object({
  attachmentId: z.string().uuid(),
});

export const publicAttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  byteSize: z.number().int(),
  status: z.string(),
  url: z.string().nullable(),
  createdAt: z.string(),
});
