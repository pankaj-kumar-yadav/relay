import { BRAND_SLUG } from '@/constants/brand.constants.js';

export const COOKIE_ACCESS = `${BRAND_SLUG}_accessToken`;
export const COOKIE_REFRESH = `${BRAND_SLUG}_refreshToken`;

/** seconds */
export const DEFAULT_ACCESS_TOKEN_VALIDITY_SEC = 900;
/** seconds */
export const DEFAULT_REFRESH_TOKEN_VALIDITY_SEC = 86400;
