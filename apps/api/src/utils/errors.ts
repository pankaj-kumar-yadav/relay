import type { Response } from 'express';

import { ErrorCode, type ErrorCodeValue, HttpStatus } from '@/constants/http.js';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCodeValue,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Invalid input') {
    super(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, message);
  }
}

export class EmailTakenError extends ApiError {
  constructor(message = 'User already exists') {
    super(HttpStatus.CONFLICT, ErrorCode.EMAIL_TAKEN, message);
  }
}

export class InvalidCredentialsError extends ApiError {
  constructor(message = 'Invalid email or password') {
    super(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, message);
  }
}

export class TokenExpiredError extends ApiError {
  constructor(message = 'Token expired') {
    super(HttpStatus.UNAUTHORIZED, ErrorCode.TOKEN_EXPIRED, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, message);
  }
}

export class SlugTakenError extends ApiError {
  constructor(message = 'Organization slug already taken') {
    super(HttpStatus.CONFLICT, ErrorCode.SLUG_TAKEN, message);
  }
}

export class TeamKeyTakenError extends ApiError {
  constructor(message = 'Team key already taken') {
    super(HttpStatus.CONFLICT, ErrorCode.TEAM_KEY_TAKEN, message);
  }
}

export class AlreadyMemberError extends ApiError {
  constructor(message = 'Already a member of this organization') {
    super(HttpStatus.CONFLICT, ErrorCode.ALREADY_MEMBER, message);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Too many attempts, try again later') {
    super(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMITED, message);
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Internal server error') {
    super(HttpStatus.INTERNAL, ErrorCode.INTERNAL, message);
  }
}

export function sendError(res: Response, err: unknown) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      data: null,
      error: { code: err.code, message: err.message },
    });
  }

  console.error(err);
  return res.status(HttpStatus.INTERNAL).json({
    success: false,
    message: 'Internal server error',
    data: null,
    error: { code: ErrorCode.INTERNAL, message: 'Internal server error' },
  });
}
