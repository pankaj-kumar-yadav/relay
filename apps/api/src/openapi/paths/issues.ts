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
import { publicIssueSchema } from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';
import {
  createIssueBodySchema,
  listIssuesQuerySchema,
  patchIssueBodySchema,
  setIssueLabelsBodySchema,
} from '@/routes/issues/issues.schema.js';

const issueIdParams = orgParams({ issueId: z.string() });

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/issues',
  tags: [OpenApiTag.ISSUES],
  summary: 'List issues',
  security: cookieAuth,
  request: { params: orgIdParams, query: listIssuesQuerySchema },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(
        z.object({
          issues: z.array(publicIssueSchema),
          nextCursor: z.string().nullable(),
        }),
      ),
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
  method: 'post',
  path: '/orgs/{orgId}/issues',
  tags: [OpenApiTag.ISSUES],
  summary: 'Create issue',
  security: cookieAuth,
  request: { params: orgIdParams, body: jsonBody(createIssueBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Created',
      successEnvelopeSchema(z.object({ issue: publicIssueSchema })),
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
  path: '/orgs/{orgId}/issues/{issueId}',
  tags: [OpenApiTag.ISSUES],
  summary: 'Get issue',
  security: cookieAuth,
  request: { params: issueIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ issue: publicIssueSchema })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/orgs/{orgId}/issues/{issueId}',
  tags: [OpenApiTag.ISSUES],
  summary: 'Update issue',
  security: cookieAuth,
  request: { params: issueIdParams, body: jsonBody(patchIssueBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Updated',
      successEnvelopeSchema(z.object({ issue: publicIssueSchema })),
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
  path: '/orgs/{orgId}/issues/{issueId}',
  tags: [OpenApiTag.ISSUES],
  summary: 'Delete issue',
  security: cookieAuth,
  request: { params: issueIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Deleted',
      successEnvelopeSchema(z.object({ id: z.string() })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'put',
  path: '/orgs/{orgId}/issues/{issueId}/labels',
  tags: [OpenApiTag.ISSUES],
  summary: 'Set issue labels',
  security: cookieAuth,
  request: { params: issueIdParams, body: jsonBody(setIssueLabelsBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ issue: publicIssueSchema })),
    ),
    ...errorResponses(
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
    ),
  },
});
