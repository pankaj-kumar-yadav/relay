import { Router } from 'express';

import { validateTokenData } from '@/auth/authUtils.js';
import {
  deleteKeyStoreById,
  findKeyStoreByKeys,
} from '@/auth/keyStore.js';
import { clearAuthCookies, createAndSetTokens } from '@/auth/tokenHelpers.js';
import { config } from '@/config.js';
import { COOKIE_ACCESS, COOKIE_REFRESH } from '@/constants/auth.js';
import { HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { loginRateLimit, registerRateLimit } from '@/middleware/auth/authRateLimit.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import {
  loginBodySchema,
  patchMeBodySchema,
  registerBodySchema,
} from '@/routes/auth/auth.schema.js';
import {
  EmailTakenError,
  InvalidCredentialsError,
  sendError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/errors.js';
import JWT from '@/utils/jwt.js';
import { hashPassword, verifyPassword } from '@/utils/passwords.js';
import { sendSuccess } from '@/utils/response.js';

export const authRouter: Router = Router();

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

authRouter.post('/register', registerRateLimit, async (req, res) => {
  try {
    const parsed = registerBodySchema.safeParse(req.body);
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

    await createAndSetTokens(res, user.id);
    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Registered',
      data: { user: publicUser(user) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/login', loginRateLimit, async (req, res) => {
  try {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    await createAndSetTokens(res, user.id);
    sendSuccess(res, {
      message: 'Logged in',
      data: {
        user: publicUser({
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: user.isSuperAdmin,
        }),
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  try {
    if (req.keyStore) {
      await deleteKeyStoreById(req.keyStore.id);
    }
    clearAuthCookies(res);
    sendSuccess(res, { message: 'Logged out', data: {} });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.get('/session', requireAuth, (req, res) => {
  sendSuccess(res, { data: { user: req.user } });
});

authRouter.patch('/me', requireAuth, async (req, res) => {
  try {
    const parsed = patchMeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: parsed.data.name },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
      },
    });

    sendSuccess(res, {
      message: 'Profile updated',
      data: { user: publicUser(user) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/refresh', async (req, res) => {
  try {
    const accessToken = req.cookies?.[COOKIE_ACCESS] as string | undefined;
    const refreshToken =
      (req.cookies?.[COOKIE_REFRESH] as string | undefined) ||
      (typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined);

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedError('Not authorized, missing tokens');
    }

    const accessPayload = await JWT.decode(accessToken);
    validateTokenData(accessPayload);

    const user = await prisma.user.findUnique({
      where: { id: accessPayload.sub },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedError('Not authorized, user not found');
    }

    const refreshPayload = await JWT.validate(refreshToken, config.tokenInfo.secret);
    validateTokenData(refreshPayload);

    if (accessPayload.sub !== refreshPayload.sub) {
      throw new UnauthorizedError('Invalid access token');
    }

    const keyStore = await findKeyStoreByKeys(
      user.id,
      accessPayload.prm,
      refreshPayload.prm,
    );
    if (!keyStore) {
      throw new UnauthorizedError('Invalid access token');
    }

    await deleteKeyStoreById(keyStore.id);
    await createAndSetTokens(res, user.id);

    sendSuccess(res, { message: 'Access token refreshed', data: {} });
  } catch (err) {
    sendError(res, err);
  }
});
