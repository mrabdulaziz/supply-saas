import { OrderStatus, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/response';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { notifyUser } from '../../services/socket.service';
import type { Request } from 'express';

// ─── Order number generator ───────────────────────────────────────────────────

async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.order.count({
    where: { createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } },
  });
  return `ORD-${dateStr}-${String(count + 1).padStart(6, '0')}`;
}

// ─── Valid transitions ────────────────────────────────────────────────────────

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: [OrderStatus.SUBMITTED, OrderStatus.CANCELLED],
  SUBMITTED: [OrderStatus.CONFIRMED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
  IN_TRANSIT: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.CLOSED],
  REJECTED: [],
  CLOSED: [],
  CANCELLED: [],
};

function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!TRANSITIONS[from]?.includes(to)) {
    throw new AppError(
      `Cannot transition order from ${from} to ${to}`,
      422,
      'INVALID_TRANSITION'
    );
  }
}

// ─── Notification helper ──────────────────────────────────────────────────────

async function notifyOrderParties(
  orderId: string,
  event: string,
  title: string,
  body: string,
  targetRole: 'market' | 'supplier'
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      market: { include: { users: { where: { role: { in: ['MARKET_ADMIN', 'MARKET_STAFF'] } } } } },
      supplier: { include: { users: { where: { role: { in: ['SUPPLIER_ADMIN', 'SUPPLIER_STAFF'] } } } } },
    },
  });
  if (!order) return;

  const targetUsers = targetRole === 'market'
    ? order.market.users
    : order.supplier.users;

  for (const user of targetUsers) {
    await prisma.notification.create({
      data: { userId: user.id, title, body, type: event, entityType: 'Order', entityId: orderId },
    });
    notifyUser(user.id, event, { orderId, title, body });
  }
}

// ─── Order Service ────────────────────────────────────────────────────────────

export const orderService = {
  async list(req: Request) {
    const { user } = req;
    if (!user) throw new AppError('Unauthorized', 401);

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as OrderStatus | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    // Scope by role
    if (user.role === 'MARKET_ADMIN' || user.role === 'MARKET_STAFF') {
      where.marketId = user.marketId;
    } else if (user.role === 'SUPPLIER_ADMIN' || user.role === 'SUPPLIER_STAFF') {
      where.supplierId = user.supplierId;
    }
    // SUPER_ADMIN sees all

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          market: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, username: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit };
  },

  async getById(id: string, req: Request) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        market: { select: { id: true, name: true, address: true, phone: true } },
        supplier: { select: { id: true, name: true, phone: true } },
        createdBy: { select: { id: true, username: true } },
        confirmedBy: { select: { id: true, username: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true, images: true } },
          },
        },
        statusHistory: {
          include: { changedBy: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) throw new AppError('Order not found', 404);

    // Access control
    const { user } = req;
    if (!user) throw new AppError('Unauthorized', 401);
    if (user.role === 'MARKET_ADMIN' || user.role === 'MARKET_STAFF') {
      if (order.marketId !== user.marketId) throw new AppError('Forbidden', 403);
    } else if (user.role === 'SUPPLIER_ADMIN' || user.role === 'SUPPLIER_STAFF') {
      if (order.supplierId !== user.supplierId) throw new AppError('Forbidden', 403);
    }

    return order;
  },

  async create(
    req: Request,
    input: {
      supplierId: string;
      items: { productId: string; quantity: number; notes?: string }[];
      notes?: string;
    }
  ) {
    const { user } = req;
    if (!user) throw new AppError('Unauthorized', 401);
    if (!user.marketId) throw new AppError('No market associated with your account', 422);

    // Verify market is approved
    const market = await prisma.market.findUnique({ where: { id: user.marketId } });
    if (!market || market.status !== 'APPROVED') {
      throw new AppError('Market account is not approved yet', 403, 'MARKET_NOT_APPROVED');
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId, isActive: true } });
    if (!supplier) throw new AppError('Supplier not found', 404);

    // Validate products and snapshot prices
    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, supplierId: input.supplierId, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found or not from this supplier', 422);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check minimums and stock
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      if (item.quantity < product.minOrderQty) {
        throw new AppError(
          `Minimum order for "${product.name}" is ${product.minOrderQty} ${product.unit}`,
          422
        );
      }
      if (item.quantity > product.stockQty) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Available: ${product.stockQty}`,
          422
        );
      }
    }

    const orderNumber = await generateOrderNumber();

    // Calculate items and total
    const itemsData = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const subtotal = Number(product.price) * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
        notes: item.notes,
      };
    });

    const totalAmount = itemsData.reduce((sum, i) => sum + i.subtotal, 0);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        marketId: user.marketId,
        supplierId: input.supplierId,
        status: 'DRAFT',
        totalAmount,
        notes: input.notes,
        createdById: user.userId,
        items: { create: itemsData },
        statusHistory: {
          create: {
            toStatus: 'DRAFT',
            changedById: user.userId,
          },
        },
      },
      include: {
        items: { include: { product: { select: { name: true, unit: true } } } },
        market: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    });

    await writeAuditLog({
      req,
      action: 'ORDER_CREATED',
      entityType: 'Order',
      entityId: order.id,
      newValue: { orderNumber, status: 'DRAFT', totalAmount },
    });

    return order;
  },

  async submit(id: string, req: Request) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', 404);
    assertTransition(order.status, OrderStatus.SUBMITTED);

    if (req.user?.marketId !== order.marketId) throw new AppError('Forbidden', 403);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: 'SUBMITTED',
            changedById: req.user!.userId,
          },
        },
      },
    });

    await writeAuditLog({ req, action: 'ORDER_SUBMITTED', entityType: 'Order', entityId: id,
      oldValue: { status: order.status }, newValue: { status: 'SUBMITTED' } });

    await notifyOrderParties(id, 'ORDER_SUBMITTED',
      'New Order Received', `Order ${order.orderNumber} has been submitted and awaits your confirmation.`, 'supplier');

    return updated;
  },

  async confirm(id: string, req: Request) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', 404);
    assertTransition(order.status, OrderStatus.CONFIRMED);

    if (req.user?.supplierId !== order.supplierId) throw new AppError('Forbidden', 403);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedById: req.user!.userId,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: 'CONFIRMED',
            changedById: req.user!.userId,
          },
        },
      },
    });

    await writeAuditLog({ req, action: 'ORDER_CONFIRMED', entityType: 'Order', entityId: id,
      oldValue: { status: order.status }, newValue: { status: 'CONFIRMED' } });

    await notifyOrderParties(id, 'ORDER_CONFIRMED',
      'Order Confirmed', `Your order ${order.orderNumber} has been confirmed by the supplier.`, 'market');

    return updated;
  },

  async reject(id: string, reason: string, req: Request) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', 404);
    assertTransition(order.status, OrderStatus.REJECTED);

    if (req.user?.supplierId !== order.supplierId) throw new AppError('Forbidden', 403);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: 'REJECTED',
            changedById: req.user!.userId,
            reason,
          },
        },
      },
    });

    await writeAuditLog({ req, action: 'ORDER_REJECTED', entityType: 'Order', entityId: id,
      oldValue: { status: order.status }, newValue: { status: 'REJECTED', reason } });

    await notifyOrderParties(id, 'ORDER_REJECTED',
      'Order Rejected', `Your order ${order.orderNumber} was rejected. Reason: ${reason}`, 'market');

    return updated;
  },

  async dispatch(id: string, req: Request) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', 404);
    assertTransition(order.status, OrderStatus.IN_TRANSIT);

    if (req.user?.supplierId !== order.supplierId) throw new AppError('Forbidden', 403);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'IN_TRANSIT',
        dispatchedAt: new Date(),
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: 'IN_TRANSIT',
            changedById: req.user!.userId,
          },
        },
      },
    });

    await writeAuditLog({ req, action: 'ORDER_DISPATCHED', entityType: 'Order', entityId: id,
      oldValue: { status: order.status }, newValue: { status: 'IN_TRANSIT' } });

    await notifyOrderParties(id, 'ORDER_IN_TRANSIT',
      'Order On The Way', `Order ${order.orderNumber} has been dispatched and is on its way.`, 'market');

    return updated;
  },

  async deliver(id: string, req: Request) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', 404);
    assertTransition(order.status, OrderStatus.DELIVERED);

    if (req.user?.marketId !== order.marketId) throw new AppError('Forbidden', 403);

    // Mark delivered then immediately close — both in one transaction
    const updated = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          statusHistory: {
            create: {
              fromStatus: order.status,
              toStatus: 'DELIVERED',
              changedById: req.user!.userId,
            },
          },
        },
      });

      return tx.order.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          statusHistory: {
            create: {
              fromStatus: 'DELIVERED',
              toStatus: 'CLOSED',
              changedById: req.user!.userId,
            },
          },
        },
      });
    });

    await writeAuditLog({ req, action: 'ORDER_DELIVERED', entityType: 'Order', entityId: id,
      oldValue: { status: order.status }, newValue: { status: 'CLOSED' } });

    await notifyOrderParties(id, 'ORDER_DELIVERED',
      'Order Delivered', `Order ${order.orderNumber} has been delivered and closed.`, 'supplier');

    return updated;
  },
};
