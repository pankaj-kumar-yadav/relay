import { randomUUID } from 'node:crypto';

import {
  AttachmentKind,
  AttachmentStatus,
  ATTACHMENT_FILE_NAME_MAX,
  AVATAR_MAX_BYTES,
  ISSUE_MAX_BYTES,
  ISSUE_MAX_READY_FILES,
  avatarObjectKey,
  isAvatarContentType,
  isIssueContentType,
  issueObjectKey,
  normalizeContentType,
  type AttachmentKindValue,
} from '@relay/shared/constants/attachment.constant';
import { prisma } from '@/db.js';
import { NotFoundError, StorageUnconfiguredError, ValidationError } from '@/utils/errors.js';
import { getStorage } from '@/utils/storage/storage.js';

export type PublicAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  status: string;
  url: string | null;
  createdAt: string;
};

type AttachmentRow = {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  status: string;
  objectKey: string;
  createdAt: Date;
};

export function publicAttachment(row: AttachmentRow, url: string | null): PublicAttachment {
  return {
    id: row.id,
    fileName: row.fileName,
    contentType: row.contentType,
    byteSize: row.byteSize,
    status: row.status,
    url,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function signGetUrl(objectKey: string): Promise<string | null> {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return await storage.signGetUrl(objectKey);
  } catch (err) {
    console.error('[storage] sign GET failed', err);
    return null;
  }
}

export async function avatarUrlForUser(
  avatar:
    | { objectKey: string; status: string }
    | null
    | undefined,
): Promise<string | null> {
  if (!avatar || avatar.status !== AttachmentStatus.READY) return null;
  return signGetUrl(avatar.objectKey);
}

export function parseIntentInput(
  input: { contentType: string; byteSize: number; fileName: string },
  kind: AttachmentKindValue,
) {
  const fileName = input.fileName.trim();
  if (!fileName || fileName.length > ATTACHMENT_FILE_NAME_MAX) {
    throw new ValidationError('Invalid file name');
  }
  if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    throw new ValidationError('Invalid file name');
  }
  if (!Number.isInteger(input.byteSize) || input.byteSize < 1) {
    throw new ValidationError('Invalid file size');
  }
  const contentType = normalizeContentType(input.contentType);
  if (kind === AttachmentKind.AVATAR) {
    if (!isAvatarContentType(contentType)) {
      throw new ValidationError('Avatar must be jpeg, png, or webp');
    }
    if (input.byteSize > AVATAR_MAX_BYTES) {
      throw new ValidationError('Avatar must be 2MB or smaller');
    }
  } else {
    if (!isIssueContentType(contentType)) {
      throw new ValidationError('Unsupported file type');
    }
    if (input.byteSize > ISSUE_MAX_BYTES) {
      throw new ValidationError('File must be 25MB or smaller');
    }
  }
  return { fileName, contentType, byteSize: input.byteSize };
}

export async function createIntent(input: {
  kind: AttachmentKindValue;
  userId: string;
  organizationId?: string | null;
  issueId?: string | null;
  contentType: string;
  byteSize: number;
  fileName: string;
}) {
  const storage = getStorage();
  if (!storage) throw new StorageUnconfiguredError();
  const parsed = parseIntentInput(input, input.kind);

  if (input.kind === AttachmentKind.ISSUE) {
    if (!input.organizationId || !input.issueId) {
      throw new ValidationError('Issue is required');
    }
    const readyCount = await prisma.attachment.count({
      where: {
        organizationId: input.organizationId,
        issueId: input.issueId,
        kind: AttachmentKind.ISSUE,
        status: AttachmentStatus.READY,
      },
    });
    if (readyCount >= ISSUE_MAX_READY_FILES) {
      throw new ValidationError(`An issue can have at most ${ISSUE_MAX_READY_FILES} files`);
    }
  }

  const id = randomUUID();
  const objectKey =
    input.kind === AttachmentKind.AVATAR
      ? avatarObjectKey(input.userId, id)
      : issueObjectKey(input.organizationId!, input.issueId!, id);

  const row = await prisma.attachment.create({
    data: {
      id,
      organizationId: input.organizationId ?? null,
      issueId: input.issueId ?? null,
      userId: input.userId,
      kind: input.kind,
      status: AttachmentStatus.PENDING,
      contentType: parsed.contentType,
      byteSize: parsed.byteSize,
      fileName: parsed.fileName,
      objectKey,
    },
  });

  const uploadUrl = await storage.signPutUrl(objectKey, parsed.contentType);
  return {
    attachment: publicAttachment(row, null),
    uploadUrl,
  };
}

export async function completeAvatar(userId: string, attachmentId: string) {
  const storage = getStorage();
  if (!storage) throw new StorageUnconfiguredError();

  const row = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      userId,
      kind: AttachmentKind.AVATAR,
    },
  });
  if (!row) throw new NotFoundError('Attachment not found');
  if (row.status !== AttachmentStatus.PENDING) {
    throw new ValidationError('Upload is already complete');
  }

  const head = await storage.headObject(row.objectKey);
  if (!head) throw new ValidationError('Upload not found');
  if (head.contentLength !== row.byteSize) {
    throw new ValidationError('Uploaded size does not match');
  }

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarAttachmentId: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.attachment.update({
      where: { id: row.id },
      data: { status: AttachmentStatus.READY },
    });
    await tx.user.update({
      where: { id: userId },
      data: { avatarAttachmentId: row.id },
    });
  });

  const previousId = previous?.avatarAttachmentId;
  if (previousId && previousId !== row.id) {
    const old = await prisma.attachment.findUnique({
      where: { id: previousId },
      select: { id: true, objectKey: true },
    });
    if (old) {
      try {
        await storage.deleteObject(old.objectKey);
      } catch (err) {
        console.error('[storage] delete previous avatar failed', err);
      }
      await prisma.attachment.delete({ where: { id: old.id } }).catch(() => undefined);
    }
  }

  const ready = await prisma.attachment.findUniqueOrThrow({ where: { id: row.id } });
  return publicAttachment(ready, await signGetUrl(ready.objectKey));
}

export async function clearAvatar(userId: string) {
  const storage = getStorage();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarAttachmentId: true },
  });
  const attachmentId = user?.avatarAttachmentId;
  if (!attachmentId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { avatarAttachmentId: null },
  });
  const row = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { id: true, objectKey: true },
  });
  if (!row) return;
  if (storage) {
    try {
      await storage.deleteObject(row.objectKey);
    } catch (err) {
      console.error('[storage] delete avatar object failed', err);
    }
  }
  await prisma.attachment.delete({ where: { id: row.id } }).catch(() => undefined);
}

export async function completeIssueAttachment(input: {
  organizationId: string;
  issueId: string;
  attachmentId: string;
}) {
  const storage = getStorage();
  if (!storage) throw new StorageUnconfiguredError();

  const row = await prisma.attachment.findFirst({
    where: {
      id: input.attachmentId,
      organizationId: input.organizationId,
      issueId: input.issueId,
      kind: AttachmentKind.ISSUE,
    },
  });
  if (!row) throw new NotFoundError('Attachment not found');
  if (row.status !== AttachmentStatus.PENDING) {
    throw new ValidationError('Upload is already complete');
  }

  const readyCount = await prisma.attachment.count({
    where: {
      organizationId: input.organizationId,
      issueId: input.issueId,
      kind: AttachmentKind.ISSUE,
      status: AttachmentStatus.READY,
    },
  });
  if (readyCount >= ISSUE_MAX_READY_FILES) {
    throw new ValidationError(`An issue can have at most ${ISSUE_MAX_READY_FILES} files`);
  }

  const head = await storage.headObject(row.objectKey);
  if (!head) throw new ValidationError('Upload not found');
  if (head.contentLength !== row.byteSize) {
    throw new ValidationError('Uploaded size does not match');
  }

  const ready = await prisma.attachment.update({
    where: { id: row.id },
    data: { status: AttachmentStatus.READY },
  });
  return publicAttachment(ready, await signGetUrl(ready.objectKey));
}

export async function listIssueAttachments(organizationId: string, issueId: string) {
  const rows = await prisma.attachment.findMany({
    where: {
      organizationId,
      issueId,
      kind: AttachmentKind.ISSUE,
      status: AttachmentStatus.READY,
    },
    orderBy: { createdAt: 'asc' },
  });
  const items: PublicAttachment[] = [];
  for (const row of rows) {
    items.push(publicAttachment(row, await signGetUrl(row.objectKey)));
  }
  return items;
}

export async function deleteIssueAttachment(input: {
  organizationId: string;
  issueId: string;
  attachmentId: string;
}) {
  const storage = getStorage();
  const row = await prisma.attachment.findFirst({
    where: {
      id: input.attachmentId,
      organizationId: input.organizationId,
      issueId: input.issueId,
      kind: AttachmentKind.ISSUE,
    },
  });
  if (!row) throw new NotFoundError('Attachment not found');
  if (storage) {
    try {
      await storage.deleteObject(row.objectKey);
    } catch (err) {
      console.error('[storage] delete issue object failed', err);
    }
  }
  await prisma.attachment.delete({ where: { id: row.id } });
  return { id: row.id };
}
