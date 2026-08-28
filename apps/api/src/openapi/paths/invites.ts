import { HttpStatus } from '@/constants/http.js';
import { OpenApiTag } from '@/constants/openapi.constant.js';
import {
  cookieAuth,
  errorResponses,
  jsonBody,
  jsonResponse,
  orgIdParams,
  successEnvelopeSchema,
} from '@/openapi/envelope.js';
import { registry } from '@/openapi/registry.js';
import { publicInviteSchema, publicOrgSchema } from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';
import { createInviteBodySchema } from '@/routes/invites.js';

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/invites',
  tags: [OpenApiTag.INVITES],
  summary: 'Create invite',
  security: cookieAuth,
  request: { params: orgIdParams, body: jsonBody(createInviteBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Created',
      successEnvelopeSchema(
        z.object({ invite: publicInviteSchema, token: z.string() }),
      ),
    ),
    ...errorResponses(
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
      HttpStatus.CONFLICT,
    ),
  },
});

registry.registerPath({
  method: 'post',
  path: '/invites/{token}/accept',
  tags: [OpenApiTag.INVITES],
  summary: 'Accept invite',
  security: cookieAuth,
  request: { params: z.object({ token: z.string() }) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Accepted',
      successEnvelopeSchema(
        z.object({ organization: publicOrgSchema, role: z.string() }),
      ),
    ),
    ...errorResponses(
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
      HttpStatus.CONFLICT,
    ),
  },
});
