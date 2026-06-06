import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
  phone: z
    .string()
    .regex(/^\+998\d{9}$/, 'Phone must be +998XXXXXXXXX format'),
  email: z.string().email().optional(),
  role: z.enum(['SUPPLIER_ADMIN', 'MARKET_ADMIN']).optional(),
});

export const loginSchema = z.object({
  login: z.string().min(1), // username or phone
  password: z.string().min(1),
});

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/, 'Phone must be +998XXXXXXXXX format'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/),
  code: z.string().length(6).regex(/^\d+$/, 'OTP must be 6 digits'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(), // also accepted from cookie
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
