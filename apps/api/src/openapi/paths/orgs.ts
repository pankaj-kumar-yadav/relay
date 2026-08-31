import { HttpStatus } from '@/constants/http.js';
import { OpenApiTag } from '@/constants/openapi.constant.js';
import {
  cookieAuth,
  emptyDataSchema,
  errorResponses,
  jsonBody,
  jsonResponse,
  orgIdParams,
  orgParams,
  successEnvelopeSchema,
} from '@/openapi/envelope.js';
import { registry } from '@/openapi/registry.js';
import { publicMemberSchema, publicOrgSchema, publicTeamSchema } from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';
import { patchMemberBodySchema } from '@/routes/members/members.schema.js';
import { createOrgBodySchema } from '@/routes/orgs.js';

const orgWithRoleSchema = publicOrgSchema.extend({ role: z.string() });

registry.registerPath({
  method: 'post',
  path: '/orgs',
  tags: [OpenApiTag.ORGS],
  summary: 'Create organization',
  security: cookieAuth,
  request: { body: jsonBody(createOrgBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Created',
      successEnvelopeSchema(
        z.object({
          organization: publicOrgSchema,
          role: z.string(),
          team: publicTeamSchema,
        }),
      ),
    ),
    ...errorResponses(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED, HttpStatus.CONFLICT),
  },
});

registry.registerPath({
  method: 'get',
  path: '/orgs',
  tags: [OpenApiTag.ORGS],
  summary: 'List organizations',
  security: cookieAuth,
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ organizations: z.array(orgWithRoleSchema) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED),
  },
});

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}',
  tags: [OpenApiTag.ORGS],
  summary: 'Get organization',
  security: cookieAuth,
  request: { params: orgIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(
        z.object({ organization: publicOrgSchema, role: z.string() }),
      ),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/members',
  tags: [OpenApiTag.MEMBERS],
  summary: 'List members',
  security: cookieAuth,
  request: { params: orgIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ members: z.array(publicMemberSchema) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

const memberUserParams = orgParams({ userId: z.string() });

registry.registerPath({
  method: 'patch',
  path: '/orgs/{orgId}/members/{userId}',
  tags: [OpenApiTag.MEMBERS],
  summary: 'Update member role',
  security: cookieAuth,
  request: { params: memberUserParams, body: jsonBody(patchMemberBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Member updated',
      successEnvelopeSchema(z.object({ member: publicMemberSchema })),
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
  path: '/orgs/{orgId}/members/{userId}',
  tags: [OpenApiTag.MEMBERS],
  summary: 'Remove member',
  security: cookieAuth,
  request: { params: memberUserParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Member removed',
      successEnvelopeSchema(z.object({ id: z.string() })),
    ),
    ...errorResponses(
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
    ),
  },
});
