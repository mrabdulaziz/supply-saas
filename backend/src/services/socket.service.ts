import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: Server;

export function initSocketService(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  });

  // JWT auth middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user?.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      logger.debug(`Socket connected: user ${userId}`);
    }

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: user ${userId}`);
    });
  });

  logger.info('✅ Socket.io initialized');
}

/**
 * Send a notification to a specific user
 */
export function notifyUser(userId: string, event: string, data: object) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Send to all users in a supplier room
 */
export function notifySupplier(supplierId: string, event: string, data: object) {
  if (!io) return;
  io.to(`supplier:${supplierId}`).emit(event, data);
}

export function getIO() {
  return io;
}
