import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { validateTokenData } from '@/auth/authUtils.js';
import { findActiveKeyStore } from '@/auth/keyStore.js';
import { config } from '@/config.js';
import { COOKIE_ACCESS } from '@/constants/auth.js';
import { prisma } from '@/db.js';
import {
  sendError,
  TokenExpiredError,
  UnauthorizedError,
} from '@/utils/errors.js';
import JWT from '@/utils/jwt.js';

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[COOKIE_ACCESS] as string | undefined;
    if (!token) {
      throw new UnauthorizedError('Not authorized, no token');
    }

    let payload;
    try {
      payload = await JWT.validate(token, config.tokenInfo.secret);
    } catch (error) {
      if (error instanceof TokenExpiredError) throw error;
      throw new UnauthorizedError('Not authorized, token failed');
    }

    validateTokenData(payload);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
      },
    });
    if (!user) {
      throw new UnauthorizedError('Not authorized, user not found');
    }

    const keyStore = await findActiveKeyStore(user.id, payload.prm);
    if (!keyStore) {
      throw new UnauthorizedError('Not authorized, invalid access token');
    }

    req.user = user;
    req.keyStore = {
      id: keyStore.id,
      userId: keyStore.userId,
      primaryKey: keyStore.primaryKey,
      secondaryKey: keyStore.secondaryKey,
      status: keyStore.status,
    };
    next();
  } catch (err) {
    sendError(res, err);
  }
};
