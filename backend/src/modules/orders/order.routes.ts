import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { orderService } from './order.service';
import { success, paginated } from '../../utils/response';

const router = Router();

// All order routes require auth
router.use(authenticate);

// GET /orders — list (scoped by role)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orders, total, page, limit } = await orderService.list(req);
    return paginated(res, orders, total, page, limit);
  } catch (err) { next(err); }
});

// GET /orders/:id — detail
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getById(req.params.id, req);
    return success(res, order);
  } catch (err) { next(err); }
});

// POST /orders — create draft
router.post('/',
  authorize('MARKET_ADMIN', 'MARKET_STAFF'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        supplierId: z.string().cuid(),
        items: z.array(z.object({
          productId: z.string().cuid(),
          quantity: z.number().int().positive(),
          notes: z.string().optional(),
        })).min(1),
        notes: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const order = await orderService.create(req, input);
      return res.status(201).json({ success: true, message: 'Order created', data: order });
    } catch (err) { next(err); }
  }
);

// POST /orders/:id/submit
router.post('/:id/submit',
  authorize('MARKET_ADMIN', 'MARKET_STAFF'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.submit(req.params.id, req);
      return success(res, order, 'Order submitted for supplier review');
    } catch (err) { next(err); }
  }
);

// POST /orders/:id/confirm
router.post('/:id/confirm',
  authorize('SUPPLIER_ADMIN', 'SUPPLIER_STAFF'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.confirm(req.params.id, req);
      return success(res, order, 'Order confirmed');
    } catch (err) { next(err); }
  }
);

// POST /orders/:id/reject
router.post('/:id/reject',
  authorize('SUPPLIER_ADMIN', 'SUPPLIER_STAFF'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);
      const order = await orderService.reject(req.params.id, reason, req);
      return success(res, order, 'Order rejected');
    } catch (err) { next(err); }
  }
);

// POST /orders/:id/dispatch
router.post('/:id/dispatch',
  authorize('SUPPLIER_ADMIN', 'SUPPLIER_STAFF'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.dispatch(req.params.id, req);
      return success(res, order, 'Order marked as in transit');
    } catch (err) { next(err); }
  }
);

// POST /orders/:id/deliver
router.post('/:id/deliver',
  authorize('MARKET_ADMIN', 'MARKET_STAFF'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.deliver(req.params.id, req);
      return success(res, order, 'Delivery confirmed. Order closed.');
    } catch (err) { next(err); }
  }
);

export default router;
