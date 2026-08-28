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
import {
  publicActorSchema,
  publicCommentSchema,
  reactionAggregateSchema,
} from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';
import {
  createCommentBodySchema,
  toggleReactionBodySchema,
} from '@/routes/issues/activity.schema.js';

const issueIdParams = orgParams({ issueId: z.string() });
const commentIdParams = orgParams({ issueId: z.string(), commentId: z.string() });

const activityItemSchema = z.union([
  z.object({
    kind: z.literal('event'),
    id: z.string(),
    type: z.string(),
    actor: publicActorSchema,
    payload: z.object({}).passthrough(),
    createdAt: z.string(),
  }),
  z.object({
    kind: z.literal('comment'),
    id: z.string(),
    body: z.string(),
    author: publicActorSchema,
    createdAt: z.string(),
    reactions: z.array(reactionAggregateSchema),
  }),
]);

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/issues/{issueId}/activity',
  tags: [OpenApiTag.ISSUES],
  summary: 'List issue activity',
  security: cookieAuth,
  request: { params: issueIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ items: z.array(activityItemSchema) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/issues/{issueId}/comments',
  tags: [OpenApiTag.ISSUES],
  summary: 'Create comment',
  security: cookieAuth,
  request: { params: issueIdParams, body: jsonBody(createCommentBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Created',
      successEnvelopeSchema(z.object({ comment: publicCommentSchema })),
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
  path: '/orgs/{orgId}/issues/{issueId}/comments/{commentId}',
  tags: [OpenApiTag.ISSUES],
  summary: 'Delete comment',
  security: cookieAuth,
  request: { params: commentIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Deleted',
      successEnvelopeSchema(z.object({ id: z.string() })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/issues/{issueId}/comments/{commentId}/reactions',
  tags: [OpenApiTag.ISSUES],
  summary: 'Toggle comment reaction',
  security: cookieAuth,
  request: { params: commentIdParams, body: jsonBody(toggleReactionBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Toggled',
      successEnvelopeSchema(z.object({ reactions: z.array(reactionAggregateSchema) })),
    ),
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Added',
      successEnvelopeSchema(z.object({ reactions: z.array(reactionAggregateSchema) })),
    ),
    ...errorResponses(
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
    ),
  },
});
