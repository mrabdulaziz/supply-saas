import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // Prisma unique constraint violations
  if ((err as any).code === 'P2002') {
    const field = (err as any).meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
      code: 'DUPLICATE',
    });
  }

  // Prisma not found
  if ((err as any).code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
      code: 'NOT_FOUND',
    });
  }

  // Fallback — don't leak internals in production
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}
