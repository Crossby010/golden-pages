import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createOrder,
  listUserOrders,
  getOrderById,
  getOrderByNumber,
  listAllOrders,
  getOrderStats,
} from '../services/order-service.js';
import { AppError } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// ============================================
// VALIDATION
// ============================================

const shippingInfoSchema = z.object({
  fullName: z.string().min(1).max(200).trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: z.string().min(5).max(30).trim(),
  address: z.string().min(1).max(500).trim(),
  city: z.string().min(1).max(100).trim(),
  province: z.string().min(1).max(100).trim(),
  zipCode: z.string().max(20).trim().optional().default(''),
});

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        bookId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1),
  shippingInfo: shippingInfoSchema,
  paymentMethod: z.enum(['gcash', 'maya', 'qrph', 'card']),
});

export { createOrderSchema };

// ============================================
// CONTROLLERS
// ============================================

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = createOrderSchema.parse(req.body);
    const userId = req.user?.userId || null;
    const order = await createOrder(userId, input);
    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
}

export async function listMine(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Not authenticated', 401);
    const orders = await listUserOrders(userId);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getOne(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;
    const order = await getOrderById(id, userId);
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function getByNumber(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { orderNumber } = req.params;
    const order = await getOrderByNumber(orderNumber);
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

// ============================================
// ADMIN
// ============================================

export async function listAll(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const orders = await listAllOrders(100);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function stats(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getOrderStats();
    res.json(data);
  } catch (error) {
    next(error);
  }
}