import 'dotenv/config';

import { createApp } from '@/app.js';
import { assertAuthConfig, config } from '@/config.js';

assertAuthConfig();

const app = createApp();

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
