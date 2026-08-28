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
import { publicTeamSchema } from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';
import { createTeamBodySchema, patchTeamBodySchema } from '@/routes/teams.js';

const teamIdParams = orgParams({ teamId: z.string() });

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/teams',
  tags: [OpenApiTag.TEAMS],
  summary: 'List teams',
  security: cookieAuth,
  request: { params: orgIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ teams: z.array(publicTeamSchema) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/teams',
  tags: [OpenApiTag.TEAMS],
  summary: 'Create team',
  security: cookieAuth,
  request: { params: orgIdParams, body: jsonBody(createTeamBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Created',
      successEnvelopeSchema(z.object({ team: publicTeamSchema })),
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
  method: 'get',
  path: '/orgs/{orgId}/teams/{teamId}',
  tags: [OpenApiTag.TEAMS],
  summary: 'Get team',
  security: cookieAuth,
  request: { params: teamIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ team: publicTeamSchema })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/orgs/{orgId}/teams/{teamId}',
  tags: [OpenApiTag.TEAMS],
  summary: 'Update team',
  security: cookieAuth,
  request: { params: teamIdParams, body: jsonBody(patchTeamBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Updated',
      successEnvelopeSchema(z.object({ team: publicTeamSchema })),
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
