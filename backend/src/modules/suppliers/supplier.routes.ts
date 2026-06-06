import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { success, created, paginated } from '../../utils/response';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { AppError } from '../../utils/response';

const router = Router();
router.use(authenticate);

const supplierSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  address: z.string().min(5),
  phone: z.string(),
  email: z.string().email(),
  taxId: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
});

// GET /suppliers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string;
    const where: any = { isActive: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [suppliers, total] = await prisma.$transaction([
      prisma.supplier.findMany({ where, skip: (page-1)*limit, take: limit,
        orderBy: { name: 'asc' }, include: { _count: { select: { products: true, users: true } } } }),
      prisma.supplier.count({ where }),
    ]);
    return paginated(res, suppliers, total, page, limit);
  } catch (err) { next(err); }
});

// GET /suppliers/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: { products: { where: { isActive: true }, take: 10 }, _count: { select: { products: true } } },
    });
    if (!supplier) throw new AppError('Supplier not found', 404);
    return success(res, supplier);
  } catch (err) { next(err); }
});

// POST /suppliers (SUPER_ADMIN only)
router.post('/', authorize('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = supplierSchema.parse(req.body);
    const slug = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const supplier = await prisma.supplier.create({ data: { ...input, slug } });
    await writeAuditLog({ req, action: 'SUPPLIER_CREATED', entityType: 'Supplier', entityId: supplier.id, newValue: input });
    return created(res, supplier, 'Supplier created');
  } catch (err) { next(err); }
});

// PUT /suppliers/:id
router.put('/:id', authorize('SUPER_ADMIN', 'SUPPLIER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = supplierSchema.partial().parse(req.body);
    const old = await prisma.supplier.findUnique({ where: { id: req.params.id } });
    if (!old) throw new AppError('Supplier not found', 404);
    const updated = await prisma.supplier.update({ where: { id: req.params.id }, data: input });
    await writeAuditLog({ req, action: 'SUPPLIER_UPDATED', entityType: 'Supplier', entityId: req.params.id, oldValue: old, newValue: input });
    return success(res, updated, 'Supplier updated');
  } catch (err) { next(err); }
});

export default router;
