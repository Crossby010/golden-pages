import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  listBookReviews,
  createReview,
  deleteReview,
} from '../services/review-service.js';
import { AppError } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const createReviewSchema = z.object({
  bookId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export { createReviewSchema };

export async function listForBook(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { bookId } = req.params;
    const data = await listBookReviews(bookId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Authentication required', 401);

    const input = createReviewSchema.parse(req.body);
    const review = await createReview(userId, input);
    res.status(201).json({ message: 'Review created', review });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Authentication required', 401);

    const { id } = req.params;
    await deleteReview(userId, id);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
}