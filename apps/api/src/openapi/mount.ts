import type { Express, IRouter } from 'express';
import { apiReference } from '@scalar/express-api-reference';

import { API_PREFIX } from '@/constants/http.js';
import {
  OPENAPI_DOCS_PATH,
  OPENAPI_HTTP_CLIENT,
  OPENAPI_JSON_PATH,
} from '@/constants/openapi.constant.js';
import { getOpenApiDocument } from '@/openapi/document.js';

export function mountOpenApiDocs(app: Express, v1: IRouter) {
  v1.get(OPENAPI_JSON_PATH, (_req, res) => {
    res.json(getOpenApiDocument());
  });
  app.use(
    OPENAPI_DOCS_PATH,
    apiReference({
      url: `${API_PREFIX}${OPENAPI_JSON_PATH}`,
      defaultHttpClient: OPENAPI_HTTP_CLIENT,
    }),
  );
}
