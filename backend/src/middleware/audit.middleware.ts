import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Usage: router.post('/orders/:id/confirm', authenticate, auditLog('ORDER_CONFIRMED', 'Order'), handler)
 */
export function auditLog(action: string, entityType: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Attach audit metadata to req for the controller to use
    req.auditMeta = { action, entityType };
    next();
  };
}

/**
 * Call this from controllers after the operation succeeds.
 */
export async function writeAuditLog(params: {
  req: Request;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: object | null;
  newValue?: object | null;
}) {
  if (!params.req.user) return;
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.req.user.userId,
        actorRole: params.req.user.role,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
        ipAddress: params.req.ip,
        userAgent: params.req.headers['user-agent'],
      },
    });
  } catch (err) {
    // Never let audit logging break the main flow
    logger.error('Audit log write failed', err);
  }
}

declare global {
  namespace Express {
    interface Request {
      auditMeta?: { action: string; entityType: string };
    }
  }
}
