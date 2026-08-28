import { HttpStatus } from '@/constants/http.js';
import { OpenApiTag } from '@/constants/openapi.constant.js';
import { jsonResponse, successEnvelopeSchema } from '@/openapi/envelope.js';
import { registry } from '@/openapi/registry.js';
import { z } from '@/openapi/zod.js';

const healthDataSchema = z.object({
  service: z.string(),
});

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: [OpenApiTag.HEALTH],
  summary: 'Health check',
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'API is up',
      successEnvelopeSchema(healthDataSchema),
    ),
  },
});
