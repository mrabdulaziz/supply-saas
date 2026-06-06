import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error('❌ Redis error', err));
