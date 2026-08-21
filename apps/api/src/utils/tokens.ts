import type { Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '@/config.js';

const COOKIE_NAME = 'jwt';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function generateToken(res: Response, userId: string): void {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '30d' });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

export function clearToken(res: Response): void {
  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/',
  });
}

export { COOKIE_NAME };
