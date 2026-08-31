import { createHash, randomBytes } from 'node:crypto';

import { RESET_PASSWORD_TTL_MS, RESET_TOKEN_BYTES } from '@/constants/mail.constant.js';

export function generatePasswordResetToken(): string {
  return randomBytes(RESET_TOKEN_BYTES).toString('base64url');
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function passwordResetExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + RESET_PASSWORD_TTL_MS);
}
