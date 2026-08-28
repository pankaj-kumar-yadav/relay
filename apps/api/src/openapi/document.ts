import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';

import { BRAND_NAME } from '@/constants/brand.constant.js';
import { API_PREFIX } from '@/constants/http.js';
import { OPENAPI_VERSION } from '@/constants/openapi.constant.js';
import { registry } from '@/openapi/registry.js';
import '@/openapi/paths/index.js';

/** Generated OpenAPI 3 document. Narrower than openapi3-ts so tsc does not leak that package. */
export type OpenApiDocument = {
  openapi: string;
  info: { title: string; version: string; description?: string };
  paths?: Record<string, unknown>;
  components?: Record<string, unknown>;
  servers?: Array<{ url: string }>;
};

export function getOpenApiDocument(): OpenApiDocument {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: `${BRAND_NAME} API`,
      version: OPENAPI_VERSION,
      description:
        'First-party cookie API for the Relay web app. Cookie session auth. All routes are under /api/v1.',
    },
    servers: [{ url: API_PREFIX }],
  }) as OpenApiDocument;
}
