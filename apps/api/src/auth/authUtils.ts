import { z } from 'zod';

import { config } from '@/config.js';
import { InternalError, UnauthorizedError } from '@/utils/errors.js';
import JWT, { JWTPayload } from '@/utils/jwt.js';

export async function createTokens(
  userId: string,
  accessTokenKey: string,
  refreshTokenKey: string,
) {
  const { tokenInfo } = config;
  const accessPayload = new JWTPayload(
    tokenInfo.issuer,
    tokenInfo.audience,
    userId,
    accessTokenKey,
    tokenInfo.accessTokenValidity,
  );
  const accessToken = await JWT.encode(accessPayload, tokenInfo.secret);
  if (!accessToken) throw new InternalError('Failed to create access token');

  const refreshPayload = new JWTPayload(
    tokenInfo.issuer,
    tokenInfo.audience,
    userId,
    refreshTokenKey,
    tokenInfo.refreshTokenValidity,
  );
  const refreshToken = await JWT.encode(refreshPayload, tokenInfo.secret);
  if (!refreshToken) throw new InternalError('Failed to create refresh token');

  return { accessToken, refreshToken };
}

export function validateTokenData(payload: JWTPayload): void {
  const { tokenInfo } = config;
  const uuidOk = z.string().uuid().safeParse(payload?.sub).success;
  if (
    !payload ||
    payload.iss !== tokenInfo.issuer ||
    payload.aud !== tokenInfo.audience ||
    !payload.sub ||
    !payload.prm ||
    !uuidOk
  ) {
    throw new UnauthorizedError('Invalid access token');
  }
}
