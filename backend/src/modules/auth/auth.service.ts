import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../utils/response';
import { smsService } from '../../services/sms.service';
import type { RegisterInput, LoginInput } from './auth.schema';

// ─── Token helpers ────────────────────────────────────────────────────────────

function generateAccessToken(payload: {
  userId: string;
  role: Role;
  supplierId?: string;
  marketId?: string;
}) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

function generateRefreshToken(payload: { userId: string; role: Role }) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  async register(input: RegisterInput) {
    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: input.username },
          { phone: input.phone },
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
    });
    if (existing) {
      if (existing.username === input.username)
        throw new AppError('Username already taken', 409, 'DUPLICATE');
      if (existing.phone === input.phone)
        throw new AppError('Phone already registered', 409, 'DUPLICATE');
      if (existing.email === input.email)
        throw new AppError('Email already registered', 409, 'DUPLICATE');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const role: Role = input.role || 'MARKET_ADMIN';

    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        phoneVerified: true,
        createdAt: true,
      },
    });

    return user;
  },

  async login(input: LoginInput, ip?: string) {
    // Find user by username or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: input.login }, { phone: input.login }],
      },
    });

    if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDS');
    if (!user.isActive) throw new AppError('Account is disabled', 403, 'DISABLED');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDS');

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      supplierId: user.supplierId ?? undefined,
      marketId: user.marketId ?? undefined,
    });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    // Store hashed refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
        supplierId: user.supplierId,
        marketId: user.marketId,
      },
    };
  },

  async refresh(token: string) {
    let payload: { userId: string; role: Role };
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH');
    }

    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash, isRevoked: false, expiresAt: { gt: new Date() } },
    });
    if (!stored) throw new AppError('Refresh token not found or revoked', 401);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true, supplierId: true, marketId: true },
    });
    if (!user || !user.isActive) throw new AppError('Account disabled', 403);

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    const newAccess = generateAccessToken({
      userId: user.id,
      role: user.role,
      supplierId: user.supplierId ?? undefined,
      marketId: user.marketId ?? undefined,
    });
    const newRefresh = generateRefreshToken({ userId: user.id, role: user.role });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(newRefresh), expiresAt },
    });

    return { accessToken: newAccess, refreshToken: newRefresh };
  },

  async logout(token: string) {
    const tokenHash = hashToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  },

  async sendOtp(phone: string) {
    // Generate OTP
    const code = Math.random().toString().slice(2, 2 + env.OTP_LENGTH);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000);

    // Invalidate any previous OTPs for this phone
    await prisma.otpCode.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    await prisma.otpCode.create({ data: { phone, code, expiresAt } });

    // Send via Eskiz
    await smsService.send(phone, `Your SupplyChain verification code: ${code}. Valid for ${env.OTP_EXPIRES_MINUTES} minutes.`);

    return { message: 'OTP sent', expiresAt };
  },

  async verifyOtp(phone: string, code: string) {
    const otp = await prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');

    // Mark used
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    // Mark phone as verified for the user
    await prisma.user.updateMany({
      where: { phone },
      data: { phoneVerified: true },
    });

    return { verified: true };
  },
};
