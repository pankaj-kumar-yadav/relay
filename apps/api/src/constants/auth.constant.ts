import { BRAND_SLUG } from '@/constants/brand.constant.js';

export const COOKIE_ACCESS = `${BRAND_SLUG}_accessToken`;
export const COOKIE_REFRESH = `${BRAND_SLUG}_refreshToken`;

/** seconds */
export const DEFAULT_ACCESS_TOKEN_VALIDITY_SEC = 900; // 15 minutes
/** seconds */
export const DEFAULT_REFRESH_TOKEN_VALIDITY_SEC = 86400; // 24 hours

/** Login: brute-force. Count failed attempts only. */
export const LOGIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
} as const;

/** Register: signup spam. Count every attempt, including successes. */
export const REGISTER_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  skipSuccessfulRequests: false,
} as const;

/** Forgot password: count every attempt (always 200). */
export const FORGOT_PASSWORD_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,
} as const;
