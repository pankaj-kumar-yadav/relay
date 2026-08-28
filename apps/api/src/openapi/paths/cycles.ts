import { HttpStatus } from '@/constants/http.js';
import { OpenApiTag } from '@/constants/openapi.constant.js';
import {
  cookieAuth,
  errorResponses,
  jsonBody,
  jsonResponse,
  orgParams,
  successEnvelopeSchema,
} from '@/openapi/envelope.js';
import { registry } from '@/openapi/registry.js';
import { publicCycleSchema } from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';
import { createCycleBodySchema, patchCycleBodySchema } from '@/routes/cycles/cycles.schema.js';

const teamIdParams = orgParams({ teamId: z.string() });
const cycleIdParams = orgParams({ teamId: z.string(), cycleId: z.string() });

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/teams/{teamId}/cycles',
  tags: [OpenApiTag.CYCLES],
  summary: 'List cycles',
  security: cookieAuth,
  request: { params: teamIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ cycles: z.array(publicCycleSchema) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/teams/{teamId}/cycles',
  tags: [OpenApiTag.CYCLES],
  summary: 'Create cycle',
  security: cookieAuth,
  request: { params: teamIdParams, body: jsonBody(createCycleBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Created',
      successEnvelopeSchema(z.object({ cycle: publicCycleSchema })),
    ),
    ...errorResponses(
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
    ),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/orgs/{orgId}/teams/{teamId}/cycles/{cycleId}',
  tags: [OpenApiTag.CYCLES],
  summary: 'Update cycle',
  security: cookieAuth,
  request: { params: cycleIdParams, body: jsonBody(patchCycleBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Updated',
      successEnvelopeSchema(z.object({ cycle: publicCycleSchema })),
    ),
    ...errorResponses(
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
    ),
  },
});
