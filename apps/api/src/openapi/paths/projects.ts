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
import { publicProjectSchema } from '@/openapi/resources.js';
import { z } from '@/openapi/zod.js';
import {
  createProjectBodySchema,
  listProjectsQuerySchema,
  patchProjectBodySchema,
} from '@/routes/projects.js';

const projectIdParams = orgParams({ projectId: z.string() });
const deletedIdSchema = successEnvelopeSchema(z.object({ id: z.string() }));

registry.registerPath({
  method: 'get',
  path: '/orgs/{orgId}/projects',
  tags: [OpenApiTag.PROJECTS],
  summary: 'List projects',
  security: cookieAuth,
  request: { params: orgIdParams, query: listProjectsQuerySchema },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ projects: z.array(publicProjectSchema) })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'post',
  path: '/orgs/{orgId}/projects',
  tags: [OpenApiTag.PROJECTS],
  summary: 'Create project',
  security: cookieAuth,
  request: { params: orgIdParams, body: jsonBody(createProjectBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Created',
      successEnvelopeSchema(z.object({ project: publicProjectSchema })),
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
  path: '/orgs/{orgId}/projects/{projectId}',
  tags: [OpenApiTag.PROJECTS],
  summary: 'Get project',
  security: cookieAuth,
  request: { params: projectIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'OK',
      successEnvelopeSchema(z.object({ project: publicProjectSchema })),
    ),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/orgs/{orgId}/projects/{projectId}',
  tags: [OpenApiTag.PROJECTS],
  summary: 'Update project',
  security: cookieAuth,
  request: { params: projectIdParams, body: jsonBody(patchProjectBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Updated',
      successEnvelopeSchema(z.object({ project: publicProjectSchema })),
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
  path: '/orgs/{orgId}/projects/{projectId}',
  tags: [OpenApiTag.PROJECTS],
  summary: 'Delete project',
  security: cookieAuth,
  request: { params: projectIdParams },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse('Deleted', deletedIdSchema),
    ...errorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND),
  },
});
