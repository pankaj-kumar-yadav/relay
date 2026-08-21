import type { Response } from 'express';

import { HttpStatus } from '@/constants/http.js';

export type ApiErrorBody = {
  code: string;
  message: string;
};

export type ApiResponse<T extends object = Record<string, unknown>> = {
  success: boolean;
  message: string;
  data: T | null;
  error: ApiErrorBody | null;
};

type SendSuccessOptions<T extends object> = {
  status?: number;
  message?: string;
  data: T;
};

export function sendSuccess<T extends object>(
  res: Response,
  { status = HttpStatus.OK, message = 'OK', data }: SendSuccessOptions<T>,
) {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    error: null,
  };
  return res.status(status).json(body);
}
