import { Request, Response, NextFunction } from 'express';
import { ApplicationException } from '../../application/shared/exceptions';

/**
 * Centralized Express error handling middleware.
 * Translates domain/application exceptions into HTTP responses.
 * Never leaks database errors or stack traces.
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApplicationException) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  // For unexpected errors, return a generic message.
  // Log the actual error internally (omitted here for brevity).
  console.error('Unexpected error:', err);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  });
}
