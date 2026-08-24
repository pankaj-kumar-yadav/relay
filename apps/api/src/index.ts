import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { assertAuthConfig, config } from '@/config.js';
import { authRouter } from '@/routes/auth.js';
import { invitesRouter } from '@/routes/invites.js';
import { orgsRouter } from '@/routes/orgs.js';
import { sendSuccess } from '@/utils/response.js';

assertAuthConfig();

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
app.use(express.json());
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

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
