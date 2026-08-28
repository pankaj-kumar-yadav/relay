import { HttpStatus } from '@/constants/http.js';
import { OpenApiTag } from '@/constants/openapi.constant.js';
import {
  cookieAuth,
  errorResponses,
  jsonResponse,
  orgIdParams,
  orgParams,
  successEnvelopeSchema,
} from '@/openapi/envelope.js';
import { registry } from '@/openapi/registry.js';
import { publicNotificationSchema } from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';

const notificationIdParams = orgParams({ notificationId: z.string() });

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/notifications',
  tags: [OpenApiTag.INBOX],
  summary: 'List notifications',
  security: cookieAuth,
  request: { params: orgIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(
        z.object({
          notifications: z.array(publicNotificationSchema),
          unreadCount: z.number().int(),
        }),
      ),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/notifications/read-all',
  tags: [OpenApiTag.INBOX],
  summary: 'Mark all notifications read',
  security: cookieAuth,
  request: { params: orgIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ unreadCount: z.literal(0) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/notifications/{notificationId}/read',
  tags: [OpenApiTag.INBOX],
  summary: 'Mark notification read',
  security: cookieAuth,
  request: { params: notificationIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ notification: publicNotificationSchema })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});
