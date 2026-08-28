import type { ResponseConfig } from '@asteasolutions/zod-to-openapi';

import { z } from '@/openapi/zod.js';

export const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  data: z.null(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export function successEnvelopeSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    success: z.literal(true),
    message: z.string(),
    data,
    error: z.null(),
  });
}

export function jsonResponse(description: string, schema: z.ZodTypeAny): ResponseConfig {
  return {
    description,
    content: { 'application/json': { schema } },
  };
}

export function jsonBody(schema: z.ZodTypeAny) {
  return {
    content: { 'application/json': { schema } },
  };
}

export const cookieAuth = [{ cookieAuth: [] }];

export const emptyDataSchema = z.object({});

export const orgIdParams = z.object({
  orgId: z.string(),
});

export function orgParams<T extends z.ZodRawShape>(extra: T) {
  return orgIdParams.extend(extra);
}

export function errorResponses(...statuses: number[]) {
  return Object.fromEntries(
    statuses.map((status) => [String(status), jsonResponse('Error', errorEnvelopeSchema)]),
  );
}
