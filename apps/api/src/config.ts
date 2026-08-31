import {
  DEFAULT_ACCESS_TOKEN_VALIDITY_SEC,
  DEFAULT_REFRESH_TOKEN_VALIDITY_SEC,
} from '@/constants/auth.js';
import { NodeEnv } from '@/constants/env.constant.js';
import { DEFAULT_SMTP_PORT } from '@/constants/mail.constant.js';

export const config = {
  port: Number(process.env.PORT) || 4000,
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL ?? '',
  isProduction: process.env.NODE_ENV === NodeEnv.PRODUCTION,
  trustProxy: process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true',
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT) || DEFAULT_SMTP_PORT,
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? '',
  },
  tokenInfo: {
    secret: process.env.TOKEN_SECRET ?? '',
    issuer: process.env.TOKEN_ISSUER ?? '',
    audience: process.env.TOKEN_AUDIENCE ?? '',
    accessTokenValidity:
      Number(process.env.ACCESS_TOKEN_VALIDITY_SEC) || DEFAULT_ACCESS_TOKEN_VALIDITY_SEC,
    refreshTokenValidity:
      Number(process.env.REFRESH_TOKEN_VALIDITY_SEC) || DEFAULT_REFRESH_TOKEN_VALIDITY_SEC,
  },
};

export function assertAuthConfig() {
  if (!config.tokenInfo.secret) {
    throw new Error('TOKEN_SECRET is not defined');
  }
  if (!config.tokenInfo.issuer) {
    throw new Error('TOKEN_ISSUER is not defined');
  }
  if (!config.tokenInfo.audience) {
    throw new Error('TOKEN_AUDIENCE is not defined');
  }
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }
}
