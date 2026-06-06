import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { success } from '../../utils/response';

const router = Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'SUPPLIER_ADMIN'));

// GET /reports/orders
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, status, supplierId, marketId } = req.query;
    const where: any = {};
    if (from || to) where.createdAt = {
      ...(from ? { gte: new Date(from as string) } : {}),
      ...(to ? { lte: new Date(to as string) } : {}),
    };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    else if (req.user!.role === 'SUPPLIER_ADMIN') where.supplierId = req.user!.supplierId;
    if (marketId) where.marketId = marketId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        market: { select: { name: true } },
        supplier: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      total: orders.length,
      totalAmount: orders.reduce((s, o) => s + Number(o.totalAmount), 0),
      byStatus: orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return success(res, { orders, summary });
  } catch (err) { next(err); }
});

// GET /reports/products — top ordered products
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = req.user!.role === 'SUPPLIER_ADMIN' ? req.user!.supplierId : req.query.supplierId as string;
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: supplierId ? { product: { supplierId } } : undefined,
      _sum: { quantity: true, subtotal: true },
      _count: { orderId: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20,
    });
    return success(res, topProducts);
  } catch (err) { next(err); }
});

export default router;
