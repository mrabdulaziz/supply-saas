import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { success, created, paginated } from '../../utils/response';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { AppError } from '../../utils/response';

const router = Router();
router.use(authenticate);

const productSchema = z.object({
  supplierId: z.string().cuid(),
  categoryId: z.string().cuid().optional(),
  name: z.string().min(2).max(200),
  sku: z.string().min(2).max(50),
  description: z.string().optional(),
  unit: z.string().min(1),
  price: z.number().positive(),
  stockQty: z.number().int().min(0).default(0),
  minOrderQty: z.number().int().min(1).default(1),
});

// GET /products — browse catalog
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const { search, supplierId, categoryId, minPrice, maxPrice } = req.query;
    const where: any = { isActive: true };
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (supplierId) where.supplierId = supplierId;
    if (categoryId) where.categoryId = categoryId;
    if (minPrice || maxPrice) where.price = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice ? { lte: Number(maxPrice) } : {}),
    };
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({ where, skip: (page-1)*limit, take: limit,
        orderBy: { name: 'asc' },
        include: { supplier: { select: { id: true, name: true } }, category: { select: { id: true, name: true } } } }),
      prisma.product.count({ where }),
    ]);
    return paginated(res, products, total, page, limit);
  } catch (err) { next(err); }
});

// GET /products/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { supplier: { select: { id: true, name: true } }, category: true },
    });
    if (!product) throw new AppError('Product not found', 404);
    return success(res, product);
  } catch (err) { next(err); }
});

// POST /products
router.post('/', authorize('SUPPLIER_ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = productSchema.parse(req.body);
    // Supplier staff can only create for their own supplier
    if (req.user!.role === 'SUPPLIER_ADMIN' && req.user!.supplierId !== input.supplierId) {
      throw new AppError('Cannot create products for another supplier', 403);
    }
    const product = await prisma.product.create({ data: { ...input, price: input.price } });
    await writeAuditLog({ req, action: 'PRODUCT_CREATED', entityType: 'Product', entityId: product.id, newValue: input });
    return created(res, product, 'Product created');
  } catch (err) { next(err); }
});

// PUT /products/:id
router.put('/:id', authorize('SUPPLIER_ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = productSchema.partial().parse(req.body);
    const old = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!old) throw new AppError('Product not found', 404);
    const updated = await prisma.product.update({ where: { id: req.params.id }, data: input });
    await writeAuditLog({ req, action: 'PRODUCT_UPDATED', entityType: 'Product', entityId: req.params.id, oldValue: old, newValue: input });
    return success(res, updated, 'Product updated');
  } catch (err) { next(err); }
});

// PATCH /products/:id/stock
router.patch('/:id/stock', authorize('SUPPLIER_ADMIN', 'SUPPLIER_STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stockQty } = z.object({ stockQty: z.number().int().min(0) }).parse(req.body);
    const old = await prisma.product.findUnique({ where: { id: req.params.id }, select: { stockQty: true } });
    if (!old) throw new AppError('Product not found', 404);
    const updated = await prisma.product.update({ where: { id: req.params.id }, data: { stockQty } });
    await writeAuditLog({ req, action: 'PRODUCT_STOCK_UPDATED', entityType: 'Product', entityId: req.params.id,
      oldValue: { stockQty: old.stockQty }, newValue: { stockQty } });
    return success(res, updated, 'Stock updated');
  } catch (err) { next(err); }
});

export default router;
