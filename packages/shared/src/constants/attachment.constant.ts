export const AttachmentKind = {
  AVATAR: 'avatar',
  ISSUE: 'issue',
} as const;

export type AttachmentKindValue = (typeof AttachmentKind)[keyof typeof AttachmentKind];

export const AttachmentStatus = {
  PENDING: 'pending',
  READY: 'ready',
} as const;

export type AttachmentStatusValue =
  (typeof AttachmentStatus)[keyof typeof AttachmentStatus];

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const ISSUE_MAX_BYTES = 25 * 1024 * 1024;
export const ISSUE_MAX_READY_FILES = 20;
export const ATTACHMENT_FILE_NAME_MAX = 255;
export const PUT_URL_TTL_SEC = 15 * 60;
export const GET_URL_TTL_SEC = 5 * 60;

export const AVATAR_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ISSUE_CONTENT_TYPES = [
  ...AVATAR_CONTENT_TYPES,
  'application/pdf',
  'text/plain',
  'application/zip',
] as const;

export function normalizeContentType(value: string): string {
  return value.split(';')[0]?.trim().toLowerCase() ?? '';
}

export function isAvatarContentType(value: string): boolean {
  return (AVATAR_CONTENT_TYPES as readonly string[]).includes(
    normalizeContentType(value),
  );
}

export function isIssueContentType(value: string): boolean {
  return (ISSUE_CONTENT_TYPES as readonly string[]).includes(
    normalizeContentType(value),
  );
}

export function avatarObjectKey(userId: string, attachmentId: string): string {
  return `avatars/${userId}/${attachmentId}`;
}

export function issueObjectKey(
  orgId: string,
  issueId: string,
  attachmentId: string,
): string {
  return `orgs/${orgId}/issues/${issueId}/${attachmentId}`;
}
