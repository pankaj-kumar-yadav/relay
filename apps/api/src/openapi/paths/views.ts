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
import { publicViewSchema } from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';
import {
  createViewBodySchema,
  patchViewBodySchema,
} from '@/routes/views/views.schema.js';

const viewIdParams = orgParams({ viewId: z.string() });

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/views',
  tags: [OpenApiTag.VIEWS],
  summary: 'List views',
  security: cookieAuth,
  request: { params: orgIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ views: z.array(publicViewSchema) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/views',
  tags: [OpenApiTag.VIEWS],
  summary: 'Create view',
  security: cookieAuth,
  request: { params: orgIdParams, body: jsonBody(createViewBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Created',
      successEnvelopeSchema(z.object({ view: publicViewSchema })),
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
  method: 'get',
  path: '/orgs/{orgId}/views/{viewId}',
  tags: [OpenApiTag.VIEWS],
  summary: 'Get view',
  security: cookieAuth,
  request: { params: viewIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ view: publicViewSchema })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/orgs/{orgId}/views/{viewId}',
  tags: [OpenApiTag.VIEWS],
  summary: 'Update view',
  security: cookieAuth,
  request: { params: viewIdParams, body: jsonBody(patchViewBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Updated',
      successEnvelopeSchema(z.object({ view: publicViewSchema })),
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
  path: '/orgs/{orgId}/views/{viewId}',
  tags: [OpenApiTag.VIEWS],
  summary: 'Delete view',
  security: cookieAuth,
  request: { params: viewIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Deleted',
      successEnvelopeSchema(z.object({ id: z.string() })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});
