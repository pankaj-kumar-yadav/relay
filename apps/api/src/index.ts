import 'dotenv/config';

import { createApp } from '@/app.js';
import { assertAuthConfig, config } from '@/config.js';
import { API_PREFIX } from '@/constants/http.js';
import { OPENAPI_DOCS_PATH } from '@/constants/openapi.constant.js';

assertAuthConfig();

const app = createApp();

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}${API_PREFIX}`);
  console.log(`API docs: http://localhost:${config.port}${OPENAPI_DOCS_PATH}`);
});
