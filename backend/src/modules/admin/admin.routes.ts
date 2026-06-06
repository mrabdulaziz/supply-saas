import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { success, paginated } from '../../utils/response';

const router = Router();
router.use(authenticate, authorize('SUPER_ADMIN'));

// GET /admin/audit-logs
router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const { actorId, entityType, action, from, to } = req.query;
    const where: any = {};
    if (actorId) where.actorId = actorId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = { contains: action as string };
    if (from || to) where.createdAt = {
      ...(from ? { gte: new Date(from as string) } : {}),
      ...(to ? { lte: new Date(to as string) } : {}),
    };
    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({ where, skip: (page-1)*limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { username: true, role: true } } } }),
      prisma.auditLog.count({ where }),
    ]);
    return paginated(res, logs, total, page, limit);
  } catch (err) { next(err); }
});

// GET /admin/users
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({ skip: (page-1)*limit, take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, email: true, phone: true, role: true, isActive: true,
          phoneVerified: true, supplierId: true, marketId: true, createdAt: true } }),
      prisma.user.count(),
    ]);
    return paginated(res, users, total, page, limit);
  } catch (err) { next(err); }
});

// PATCH /admin/users/:id
router.patch('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = z.object({
      isActive: z.boolean().optional(),
      role: z.enum(['SUPER_ADMIN','SUPPLIER_ADMIN','SUPPLIER_STAFF','MARKET_ADMIN','MARKET_STAFF']).optional(),
      supplierId: z.string().cuid().nullable().optional(),
      marketId: z.string().cuid().nullable().optional(),
    }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: input,
      select: { id: true, username: true, role: true, isActive: true },
    });
    return success(res, user, 'User updated');
  } catch (err) { next(err); }
});

// GET /admin/dashboard — platform stats
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalOrders, totalSuppliers, totalMarkets, totalUsers, recentOrders] = await prisma.$transaction([
      prisma.order.count(),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.market.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.order.findMany({
        take: 10, orderBy: { createdAt: 'desc' },
        include: { market: { select: { name: true } }, supplier: { select: { name: true } } },
      }),
    ]);
    return success(res, { totalOrders, totalSuppliers, totalMarkets, totalUsers, recentOrders });
  } catch (err) { next(err); }
});

export default router;
