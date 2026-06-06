import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/response';

export interface AuthPayload {
  userId: string;
  role: Role;
  supplierId?: string;
  marketId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.access_token;

    if (!token) throw new AppError('Authentication required', 401, 'NO_TOKEN');

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else {
      next(err);
    }
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    next();
  };
}

// Verify the user still exists and is active
export async function verifyActive(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) return next(new AppError('Authentication required', 401));
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isActive: true, phoneVerified: true },
    });
    if (!user || !user.isActive) {
      return next(new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED'));
    }
    next();
  } catch (err) {
    next(err);
  }
}
