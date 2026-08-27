import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type ErrorRequestHandler, type Express } from 'express';

import { config } from '@/config.js';
import { JSON_BODY_LIMIT } from '@/constants/http.js';
import { authRouter } from '@/routes/auth/auth.js';
import { invitesRouter } from '@/routes/invites.js';
import { orgsRouter } from '@/routes/orgs.js';
import { NotFoundError, sendError, ValidationError } from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';

export function createApp(): Express {
  const app = express();

  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(
    cors({
      origin: config.webOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    sendSuccess(res, {
      message: 'OK',
      data: { service: 'relay-api' },
    });
  });

  app.use('/auth', authRouter);
  app.use('/orgs', orgsRouter);
  app.use('/invites', invitesRouter);

  app.use((_req, res) => {
    sendError(res, new NotFoundError('Not found'));
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
      sendError(res, new ValidationError('Request body too large'));
      return;
    }
    if (err instanceof SyntaxError && 'body' in err) {
      sendError(res, new ValidationError('Invalid JSON'));
      return;
    }
    sendError(res, err);
  };
  app.use(errorHandler);

  return app;
}
