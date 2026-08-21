import crypto from 'node:crypto';
import type { Response } from 'express';

import { createTokens } from '@/auth/authUtils.js';
import { createKeyStore } from '@/auth/keyStore.js';
import { config } from '@/config.js';
import { COOKIE_ACCESS, COOKIE_REFRESH } from '@/constants/auth.js';

function cookieBase() {
  return {
    httpOnly: true as const,
    secure: config.isProduction,
    sameSite: (config.isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
}

export async function createAndSetTokens(res: Response, userId: string) {
  const primaryKey = crypto.randomBytes(64).toString('hex');
  const secondaryKey = crypto.randomBytes(64).toString('hex');

  await createKeyStore(userId, primaryKey, secondaryKey);
  const tokens = await createTokens(userId, primaryKey, secondaryKey);

  const accessMs = config.tokenInfo.accessTokenValidity * 1000;
  const refreshMs = config.tokenInfo.refreshTokenValidity * 1000;

  res.cookie(COOKIE_ACCESS, tokens.accessToken, {
    ...cookieBase(),
    maxAge: accessMs,
  });
  res.cookie(COOKIE_REFRESH, tokens.refreshToken, {
    ...cookieBase(),
    maxAge: refreshMs,
  });

  return tokens;
}

export function clearAuthCookies(res: Response) {
  const base = cookieBase();
  res.cookie(COOKIE_ACCESS, '', { ...base, expires: new Date(0) });
  res.cookie(COOKIE_REFRESH, '', { ...base, expires: new Date(0) });
}
