import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from './auth.schema';
import { success, created } from '../../utils/response';
import { env } from '../../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.parse(req.body);
      const user = await authService.register(input);
      return created(res, user, 'Account created. Please verify your phone number.');
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input, req.ip);
      res.cookie('access_token', result.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refresh_token', result.refreshToken, COOKIE_OPTIONS);
      return success(res, {
        accessToken: result.accessToken,
        user: result.user,
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token =
        req.cookies?.refresh_token || req.body?.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, message: 'Refresh token required' });
      }
      const tokens = await authService.refresh(token);
      res.cookie('access_token', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refresh_token', tokens.refreshToken, COOKIE_OPTIONS);
      return success(res, { accessToken: tokens.accessToken }, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refresh_token || req.body?.refreshToken;
      if (token) await authService.logout(token);
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return success(res, null, 'Logged out');
    } catch (err) {
      next(err);
    }
  },

  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = sendOtpSchema.parse(req.body);
      const result = await authService.sendOtp(phone);
      return success(res, result, 'OTP sent to phone');
    } catch (err) {
      next(err);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, code } = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyOtp(phone, code);
      return success(res, result, 'Phone verified successfully');
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const { prisma } = await import('../../config/database');
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          phoneVerified: true,
          supplierId: true,
          marketId: true,
          createdAt: true,
        },
      });
      return success(res, user);
    } catch (err) {
      next(err);
    }
  },
};
