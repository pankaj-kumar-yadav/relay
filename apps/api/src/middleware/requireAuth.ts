import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '@/config.js';
import { prisma } from '@/db.js';
import {
  sendError,
  TokenExpiredError,
  UnauthorizedError,
} from '@/utils/errors.js';
import { COOKIE_NAME } from '@/utils/tokens.js';

type JwtPayload = { userId: string };

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] as string | undefined;

    if (!token) {
      throw new UnauthorizedError('Not authorized, no token');
    }

    if (!config.jwtSecret) {
      throw new UnauthorizedError('JWT secret is not configured');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new TokenExpiredError();
      }
      throw new UnauthorizedError('Not authorized, token failed');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    req.user = user;
    next();
  } catch (err) {
    sendError(res, err);
  }
};
