import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middleware/error.middleware';
import { initSocketService } from './services/socket.service';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import supplierRoutes from './modules/suppliers/supplier.routes';
import productRoutes from './modules/products/product.routes';
import marketRoutes from './modules/markets/market.routes';
import orderRoutes from './modules/orders/order.routes';
import reportRoutes from './modules/reports/report.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();
const httpServer = createServer(app);

// ─── Global Middleware ────────────────────────────────────────────────────────

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, slow down.' },
});

app.use(globalLimiter);

// ─── Static files (uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(env.UPLOAD_DIR));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/suppliers`, supplierRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/markets`, marketRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/admin`, adminRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Socket.io ────────────────────────────────────────────────────────────────
initSocketService(httpServer);

// ─── Start ────────────────────────────────────────────────────────────────────
async function bootstrap() {
  await connectDatabase();
  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    logger.info(`📌 Environment: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});

export { app, httpServer };
