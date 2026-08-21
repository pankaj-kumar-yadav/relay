import { Router } from 'express';
import { z } from 'zod';

import { HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import {
  EmailTakenError,
  InvalidCredentialsError,
  sendError,
  ValidationError,
} from '@/utils/errors.js';
import { hashPassword, verifyPassword } from '@/utils/passwords.js';
import { clearToken, generateToken } from '@/utils/tokens.js';

export const authRouter: Router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
  };
}

authRouter.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new EmailTakenError();
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
      },
    });

    generateToken(res, user.id);
    res.status(HttpStatus.CREATED).json({ user: publicUser(user) });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    generateToken(res, user.id);
    res.status(HttpStatus.OK).json({
      user: publicUser({
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: user.isSuperAdmin,
      }),
    });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/logout', (_req, res) => {
  clearToken(res);
  res.status(HttpStatus.OK).json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.status(HttpStatus.OK).json({ user: req.user });
});
