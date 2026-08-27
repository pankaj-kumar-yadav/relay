import { createHash, randomBytes } from 'node:crypto';

import { INVITE_EXPIRY_MS, INVITE_TOKEN_BYTES } from '@/constants/invite.js';

export function generateInviteToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString('base64url');
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function inviteExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + INVITE_EXPIRY_MS);
}
