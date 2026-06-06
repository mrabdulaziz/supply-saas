import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { success, created, paginated } from '../../utils/response';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { AppError } from '../../utils/response';
import { env } from '../../config/env';

const router = Router();

// File upload config
const storage = multer.diskStorage({
  destination: path.join(env.UPLOAD_DIR, 'documents'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const marketSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5),
  phone: z.string().regex(/^\+998\d{9}$/),
  email: z.string().email(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

// POST /markets — register (public, no auth required yet)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = marketSchema.parse(req.body);
    const market = await prisma.market.create({ data: { ...input, status: 'PENDING' } });
    return created(res, market, 'Market registered. Awaiting admin approval.');
  } catch (err) { next(err); }
});

// All below require auth
router.use(authenticate);

// GET /markets
router.get('/', authorize('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as any;
    const where: any = {};
    if (status) where.status = status;
    const [markets, total] = await prisma.$transaction([
      prisma.market.findMany({ where, skip: (page-1)*limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { approvedBy: { select: { username: true } }, _count: { select: { orders: true, documents: true } } } }),
      prisma.market.count({ where }),
    ]);
    return paginated(res, markets, total, page, limit);
  } catch (err) { next(err); }
});

// GET /markets/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
      include: { documents: true, approvedBy: { select: { username: true } } },
    });
    if (!market) throw new AppError('Market not found', 404);
    // Markets can only see themselves
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.marketId !== market.id) {
      throw new AppError('Forbidden', 403);
    }
    return success(res, market);
  } catch (err) { next(err); }
});

// PATCH /markets/:id/approve
router.patch('/:id/approve', authorize('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const market = await prisma.market.findUnique({ where: { id: req.params.id } });
    if (!market) throw new AppError('Market not found', 404);
    const updated = await prisma.market.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedById: req.user!.userId, approvedAt: new Date() },
    });
    await writeAuditLog({ req, action: 'MARKET_APPROVED', entityType: 'Market', entityId: req.params.id,
      oldValue: { status: market.status }, newValue: { status: 'APPROVED' } });
    return success(res, updated, 'Market approved');
  } catch (err) { next(err); }
});

// PATCH /markets/:id/suspend
router.patch('/:id/suspend', authorize('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const updated = await prisma.market.update({
      where: { id: req.params.id },
      data: { status: 'SUSPENDED', notes: reason },
    });
    await writeAuditLog({ req, action: 'MARKET_SUSPENDED', entityType: 'Market', entityId: req.params.id, newValue: { reason } });
    return success(res, updated, 'Market suspended');
  } catch (err) { next(err); }
});

// POST /markets/:id/documents
router.post('/:id/documents',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError('No file uploaded', 422);
      const { type } = z.object({
        type: z.enum(['BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'ADDRESS_PROOF', 'OWNER_ID', 'OTHER'])
      }).parse(req.body);
      const doc = await prisma.marketDocument.create({
        data: {
          marketId: req.params.id,
          type,
          filePath: req.file.path,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          uploadedById: req.user!.userId,
        },
      });
      return created(res, doc, 'Document uploaded');
    } catch (err) { next(err); }
  }
);

export default router;
