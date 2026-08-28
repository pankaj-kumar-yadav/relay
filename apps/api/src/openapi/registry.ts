import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { COOKIE_ACCESS } from '@/constants/auth.js';

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: COOKIE_ACCESS,
});
