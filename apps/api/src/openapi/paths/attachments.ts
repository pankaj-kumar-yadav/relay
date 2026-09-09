import { HttpStatus } from '@/constants/http.constant.js';
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
import { z } from '@/openapi/zod.js';
import { publicUserSchema } from '@/routes/auth/auth.schema.js';
import {
  completeAvatarBodySchema,
  intentBodySchema,
  publicAttachmentSchema,
} from '@/routes/attachments/attachments.schema.js';

const issueAttachmentParams = orgParams({
  issueId: z.string(),
  attachmentId: z.string(),
});
const issueParams = orgParams({ issueId: z.string() });

registry.registerPath({
  method: 'post',
  path: '/auth/me/avatar/intent',
  tags: [OpenApiTag.ATTACHMENTS],
  summary: 'Start an avatar upload',
  security: cookieAuth,
  request: { body: jsonBody(intentBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Upload started',
      successEnvelopeSchema(
        z.object({
          attachment: publicAttachmentSchema,
          uploadUrl: z.string(),
        }),
      ),
    ),
    ...errorResponses(
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.SERVICE_UNAVAILABLE,
    ),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/me/avatar/complete',
  tags: [OpenApiTag.ATTACHMENTS],
  summary: 'Finish an avatar upload',
  security: cookieAuth,
  request: { body: jsonBody(completeAvatarBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Avatar updated',
      successEnvelopeSchema(
        z.object({
          attachment: publicAttachmentSchema,
          user: publicUserSchema,
        }),
      ),
    ),
    ...errorResponses(
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.NOT_FOUND,
      HttpStatus.SERVICE_UNAVAILABLE,
    ),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/auth/me/avatar',
  tags: [OpenApiTag.ATTACHMENTS],
  summary: 'Remove the current avatar',
  security: cookieAuth,
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Avatar removed',
      successEnvelopeSchema(z.object({ user: publicUserSchema })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/issues/{issueId}/attachments/intent',
  tags: [OpenApiTag.ATTACHMENTS],
  summary: 'Start an issue file upload',
  security: cookieAuth,
  request: { params: issueParams, body: jsonBody(intentBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Upload started',
      successEnvelopeSchema(
        z.object({
          attachment: publicAttachmentSchema,
          uploadUrl: z.string(),
        }),
      ),
    ),
    ...errorResponses(
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
      HttpStatus.SERVICE_UNAVAILABLE,
    ),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/issues/{issueId}/attachments/{attachmentId}/complete',
  tags: [OpenApiTag.ATTACHMENTS],
  summary: 'Finish an issue file upload',
  security: cookieAuth,
  request: { params: issueAttachmentParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Upload complete',
      successEnvelopeSchema(z.object({ attachment: publicAttachmentSchema })),
    ),
    ...errorResponses(
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
      HttpStatus.SERVICE_UNAVAILABLE,
    ),
  },
});

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/issues/{issueId}/attachments',
  tags: [OpenApiTag.ATTACHMENTS],
  summary: 'List issue files',
  security: cookieAuth,
  request: { params: issueParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ attachments: z.array(publicAttachmentSchema) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/orgs/{orgId}/issues/{issueId}/attachments/{attachmentId}',
  tags: [OpenApiTag.ATTACHMENTS],
  summary: 'Delete an issue file',
  security: cookieAuth,
  request: { params: issueAttachmentParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Attachment deleted',
      successEnvelopeSchema(z.object({ id: z.string() })),
    ),
    ...errorResponses(
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
    ),
  },
});
