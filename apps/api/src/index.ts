import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 4000;
const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';

app.use(
  cors({
    origin: webOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'relay-api' });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
