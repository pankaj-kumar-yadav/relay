import { Router } from 'express';

import { AttachmentKind } from '@relay/shared/constants/attachment.constant';
import { HttpStatus } from '@/constants/http.constant.js';
import { prisma } from '@/db.js';
import { intentBodySchema } from '@/routes/attachments/attachments.schema.js';
import { NotFoundError, sendError, ValidationError } from '@/utils/errors.js';
import { parseIssueRef } from '@/utils/issue/issueRef.js';
import { sendSuccess } from '@/utils/response.js';
import {
  completeIssueAttachment,
  createIntent,
  deleteIssueAttachment,
  listIssueAttachments,
} from '@/utils/storage/attachment.js';

export const issueAttachmentsRouter: Router = Router({ mergeParams: true });

async function findIssueId(organizationId: string, rawId: string) {
  const ref = parseIssueRef(rawId);
  if (!ref) return null;
  if (ref.kind === 'id') {
    const row = await prisma.issue.findFirst({
      where: { id: ref.id, organizationId },
      select: { id: true },
    });
    return row?.id ?? null;
  }
  const row = await prisma.issue.findFirst({
    where: {
      organizationId,
      number: ref.number,
      team: { key: ref.teamKey, organizationId },
    },
    select: { id: true },
  });
  return row?.id ?? null;
}

issueAttachmentsRouter.post('/:issueId/attachments/intent', async (req, res) => {
  try {
    const parsed = intentBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }
    const issueId = await findIssueId(req.org!.id, req.params.issueId);
    if (!issueId) throw new NotFoundError('Issue not found');
    const result = await createIntent({
      kind: AttachmentKind.ISSUE,
      userId: req.user!.id,
      organizationId: req.org!.id,
      issueId,
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

issueAttachmentsRouter.post(
  '/:issueId/attachments/:attachmentId/complete',
  async (req, res) => {
    try {
      const issueId = await findIssueId(req.org!.id, req.params.issueId);
      if (!issueId) throw new NotFoundError('Issue not found');
      const attachment = await completeIssueAttachment({
        organizationId: req.org!.id,
        issueId,
        attachmentId: req.params.attachmentId,
      });
      sendSuccess(res, {
        message: 'Upload complete',
        data: { attachment },
      });
    } catch (err) {
      sendError(res, err);
    }
  },
);

issueAttachmentsRouter.get('/:issueId/attachments', async (req, res) => {
  try {
    const issueId = await findIssueId(req.org!.id, req.params.issueId);
    if (!issueId) throw new NotFoundError('Issue not found');
    const attachments = await listIssueAttachments(req.org!.id, issueId);
    sendSuccess(res, { data: { attachments } });
  } catch (err) {
    sendError(res, err);
  }
});

issueAttachmentsRouter.delete('/:issueId/attachments/:attachmentId', async (req, res) => {
  try {
    const issueId = await findIssueId(req.org!.id, req.params.issueId);
    if (!issueId) throw new NotFoundError('Issue not found');
    const deleted = await deleteIssueAttachment({
      organizationId: req.org!.id,
      issueId,
      attachmentId: req.params.attachmentId,
    });
    sendSuccess(res, { message: 'Attachment deleted', data: deleted });
  } catch (err) {
    sendError(res, err);
  }
});
