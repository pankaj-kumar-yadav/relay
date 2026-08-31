import { HttpStatus } from '@/constants/http.js';
import { OpenApiTag } from '@/constants/openapi.constant.js';
import {
  errorEnvelopeSchema,
  jsonBody,
  jsonResponse,
  successEnvelopeSchema,
} from '@/openapi/envelope.js';
import { registry } from '@/openapi/registry.js';
import { z } from '@/openapi/zod.js';
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  patchMeBodySchema,
  publicUserSchema,
  registerBodySchema,
  resetPasswordBodySchema,
} from '@/routes/auth/auth.schema.js';

const userDataSchema = z.object({ user: publicUserSchema });
const emptyDataSchema = z.object({});
const cookieAuth = [{ cookieAuth: [] }];

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: [OpenApiTag.AUTH],
  summary: 'Register',
  request: { body: jsonBody(registerBodySchema) },
  responses: {
    [String(HttpStatus.CREATED)]: jsonResponse(
      'Registered',
      successEnvelopeSchema(userDataSchema),
    ),
    [String(HttpStatus.BAD_REQUEST)]: jsonResponse('Invalid input', errorEnvelopeSchema),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: [OpenApiTag.AUTH],
  summary: 'Log in',
  request: { body: jsonBody(loginBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse('Logged in', successEnvelopeSchema(userDataSchema)),
    [String(HttpStatus.BAD_REQUEST)]: jsonResponse('Invalid input', errorEnvelopeSchema),
    [String(HttpStatus.UNAUTHORIZED)]: jsonResponse(
      'Invalid credentials',
      errorEnvelopeSchema,
    ),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: [OpenApiTag.AUTH],
  summary: 'Log out',
  security: cookieAuth,
  responses: {
    [String(HttpStatus.OK)]: jsonResponse('Logged out', successEnvelopeSchema(emptyDataSchema)),
    [String(HttpStatus.UNAUTHORIZED)]: jsonResponse('Unauthorized', errorEnvelopeSchema),
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/session',
  tags: [OpenApiTag.AUTH],
  summary: 'Current session',
  security: cookieAuth,
  responses: {
    [String(HttpStatus.OK)]: jsonResponse('Session', successEnvelopeSchema(userDataSchema)),
    [String(HttpStatus.UNAUTHORIZED)]: jsonResponse('Unauthorized', errorEnvelopeSchema),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/auth/me',
  tags: [OpenApiTag.AUTH],
  summary: 'Update current user',
  security: cookieAuth,
  request: { body: jsonBody(patchMeBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Profile updated',
      successEnvelopeSchema(userDataSchema),
    ),
    [String(HttpStatus.BAD_REQUEST)]: jsonResponse('Invalid input', errorEnvelopeSchema),
    [String(HttpStatus.UNAUTHORIZED)]: jsonResponse('Unauthorized', errorEnvelopeSchema),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: [OpenApiTag.AUTH],
  summary: 'Refresh tokens',
  security: cookieAuth,
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Access token refreshed',
      successEnvelopeSchema(emptyDataSchema),
    ),
    [String(HttpStatus.UNAUTHORIZED)]: jsonResponse('Unauthorized', errorEnvelopeSchema),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/forgot-password',
  tags: [OpenApiTag.AUTH],
  summary: 'Request a password reset email',
  request: { body: jsonBody(forgotPasswordBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'If that email exists, we sent a reset link',
      successEnvelopeSchema(emptyDataSchema),
    ),
    [String(HttpStatus.BAD_REQUEST)]: jsonResponse('Invalid input', errorEnvelopeSchema),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/reset-password',
  tags: [OpenApiTag.AUTH],
  summary: 'Reset password with a token',
  request: { body: jsonBody(resetPasswordBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Password reset',
      successEnvelopeSchema(emptyDataSchema),
    ),
    [String(HttpStatus.BAD_REQUEST)]: jsonResponse('Invalid input', errorEnvelopeSchema),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/change-password',
  tags: [OpenApiTag.AUTH],
  summary: 'Change password while logged in',
  security: cookieAuth,
  request: { body: jsonBody(changePasswordBodySchema) },
  responses: {
    [String(HttpStatus.OK)]: jsonResponse(
      'Password updated',
      successEnvelopeSchema(emptyDataSchema),
    ),
    [String(HttpStatus.BAD_REQUEST)]: jsonResponse('Invalid input', errorEnvelopeSchema),
    [String(HttpStatus.UNAUTHORIZED)]: jsonResponse('Unauthorized', errorEnvelopeSchema),
  },
});
