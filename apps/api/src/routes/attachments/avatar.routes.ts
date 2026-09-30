import { Router } from 'express';

import { AttachmentKind } from '@relay/shared/constants/attachment.constant';
import { HttpStatus } from '@/constants/http.constant.js';
import { prisma } from '@/db.js';
import {
  completeAvatarBodySchema,
  intentBodySchema,
} from '@/routes/attachments/attachments.schema.js';
import { sendError, ValidationError } from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';
import {
  avatarUrlForUser,
  clearAvatar,
  completeAvatar,
  createIntent,
} from '@/utils/storage/attachment.js';

export const avatarRouter: Router = Router();

export async function publicAuthUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isSuperAdmin: true,
      avatarAttachment: { select: { objectKey: true, status: true } },
    },
  });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
    avatarUrl: await avatarUrlForUser(user.avatarAttachment),
  };
}

avatarRouter.post('/intent', async (req, res) => {
  try {
    const parsed = intentBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }
    const result = await createIntent({
      kind: AttachmentKind.AVATAR,
      userId: req.user!.id,
      ...parsed.data,
    });
    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Upload started',
      data: result,
    });
  } catch (err) {
    sendError(res, err);
  }
});

avatarRouter.post('/complete', async (req, res) => {
  try {
    const parsed = completeAvatarBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }
    const attachment = await completeAvatar(req.user!.id, parsed.data.attachmentId);
    sendSuccess(res, {
      message: 'Avatar updated',
      data: { attachment, user: await publicAuthUser(req.user!.id) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

avatarRouter.delete('/', async (req, res) => {
  try {
    await clearAvatar(req.user!.id);
    sendSuccess(res, {
      message: 'Avatar removed',
      data: { user: await publicAuthUser(req.user!.id) },
    });
  } catch (err) {
    sendError(res, err);
  }
});
