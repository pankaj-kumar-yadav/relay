import { HttpStatus } from '@/constants/http.js';
import { OpenApiTag } from '@/constants/openapi.constant.js';
import {
  cookieAuth,
  errorResponses,
  jsonBody,
  jsonResponse,
  orgIdParams,
  orgParams,
  successEnvelopeSchema,
} from '@/openapi/envelope.js';
import { registry } from '@/openapi/registry.js';
import { publicLabelSchema } from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';
import { createLabelBodySchema, patchLabelBodySchema } from '@/routes/labels.js';

const labelIdParams = orgParams({ labelId: z.string() });

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/labels',
  tags: [OpenApiTag.LABELS],
  summary: 'List labels',
  security: cookieAuth,
  request: { params: orgIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ labels: z.array(publicLabelSchema) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/labels',
  tags: [OpenApiTag.LABELS],
  summary: 'Create label',
  security: cookieAuth,
  request: { params: orgIdParams, body: jsonBody(createLabelBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Created',
      successEnvelopeSchema(z.object({ label: publicLabelSchema })),
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
  path: '/orgs/{orgId}/labels/{labelId}',
  tags: [OpenApiTag.LABELS],
  summary: 'Update label',
  security: cookieAuth,
  request: { params: labelIdParams, body: jsonBody(patchLabelBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Updated',
      successEnvelopeSchema(z.object({ label: publicLabelSchema })),
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
  method: 'delete',
  path: '/orgs/{orgId}/labels/{labelId}',
  tags: [OpenApiTag.LABELS],
  summary: 'Delete label',
  security: cookieAuth,
  request: { params: labelIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Deleted',
      successEnvelopeSchema(z.object({ id: z.string() })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});
