import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { assertAuthConfig, config } from '@/config.js';
import { authRouter } from '@/routes/auth.js';
import { sendSuccess } from '@/utils/response.js';

assertAuthConfig();

const app = express();

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

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
