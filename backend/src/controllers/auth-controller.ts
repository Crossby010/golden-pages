import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  getProfile,
} from '../services/auth-service.js';
import { getUserStats } from '../services/user-service.js';
import { verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export { registerSchema, loginSchema };

// ============================================
// CONTROLLERS
// ============================================

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const result = await registerUser(email, password, name);
    res.status(201).json({
      message: 'Account created successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await loginUser(email, password);
    res.json({
      message: 'Logged in successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new AppError('Refresh token is required', 400);
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokens = await refreshTokens(payload.userId);

    res.json({
      message: 'Tokens refreshed',
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Not authenticated', 401);

    const { refreshToken } = req.body || {};
    await logoutUser(userId, refreshToken);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Not authenticated', 401);

    const user = await getProfile(userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function stats(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getUserStats();
    res.json(data);
  } catch (error) {
    next(error);
  }
}