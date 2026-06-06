import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

prisma.$on('error', (e) => {
  logger.error('Prisma error', e);
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed', error);
    process.exit(1);
  }
}
