import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type ErrorRequestHandler, type Express } from 'express';

import { config } from '@/config.js';
import { API_PREFIX, JSON_BODY_LIMIT } from '@/constants/http.js';
import { mountOpenApiDocs } from '@/openapi/mount.js';
import { authRouter } from '@/routes/auth/auth.js';
import { invitesRouter } from '@/routes/invites.js';
import { orgsRouter } from '@/routes/orgs.js';
import { NotFoundError, sendError, ValidationError } from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';

export type CreateAppOptions = {
  docs?: boolean;
};

export function createApp(options: CreateAppOptions = {}): Express {
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

  const v1 = express.Router();

  v1.get('/health', (_req, res) => {
    sendSuccess(res, {
      message: 'OK',
      data: { service: 'relay-api' },
    });
  });

  v1.use('/auth', authRouter);
  v1.use('/orgs', orgsRouter);
  v1.use('/invites', invitesRouter);

  app.use(API_PREFIX, v1);

  const enableDocs = options.docs ?? true;
  if (enableDocs) {
    mountOpenApiDocs(app, v1);
  }

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
