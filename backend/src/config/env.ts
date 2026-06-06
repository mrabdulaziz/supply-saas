import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  DATABASE_URL: process.env.DATABASE_URL!,

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),

  ESKIZ_EMAIL: process.env.ESKIZ_EMAIL || '',
  ESKIZ_PASSWORD: process.env.ESKIZ_PASSWORD || '',
  ESKIZ_FROM: process.env.ESKIZ_FROM || '4546',

  OTP_EXPIRES_MINUTES: parseInt(process.env.OTP_EXPIRES_MINUTES || '5', 10),
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH || '6', 10),
} as const;

// Validate required env vars on startup
const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
