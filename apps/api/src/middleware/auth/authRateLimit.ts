import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

import { LOGIN_RATE_LIMIT, REGISTER_RATE_LIMIT } from '@/constants/auth.js';
import { RateLimitError, sendError } from '@/utils/errors.js';

const passthrough: RequestHandler = (_req, _res, next) => {
  next();
};

export type AuthRateLimitOptions = {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
};

export function createAuthRateLimiter(options: AuthRateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Local/dev is not behind a proxy; enable TRUST_PROXY in production.
    validate: { xForwardedForHeader: false },
    handler: (_req, res) => {
      sendError(res, new RateLimitError());
    },
  }) as RequestHandler;
}

export const loginRateLimit: RequestHandler = process.env.NODE_TEST_CONTEXT
  ? passthrough
  : createAuthRateLimiter(LOGIN_RATE_LIMIT);
export const registerRateLimit: RequestHandler = process.env.NODE_TEST_CONTEXT
  ? passthrough
  : createAuthRateLimiter(REGISTER_RATE_LIMIT);
