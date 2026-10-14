import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBookStats,
  listAuthors,
} from '../services/book-service.js';
import { userOwnsBook } from '../services/order-service.js';
import { AppError } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  popular: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  sort: z
    .enum(['recent', 'title', 'author', 'price-asc', 'price-desc', 'rating'])
    .optional(),
});

const createBookSchema = z.object({
  title: z.string().min(1).max(300).trim(),
  author: z.string().min(1).max(200).trim(),
  description: z.string().max(5000).optional(),
  price: z.number().min(0).max(100000),
  coverUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  category: z.string().min(1).max(100).trim(),
  pages: z.number().int().min(0).optional(),
  publisher: z.string().max(200).optional(),
  publishedYear: z.number().int().min(1000).max(2100).optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isNew: z.boolean().optional(),
});

const updateBookSchema = createBookSchema.partial();

// ============================================
// CONTROLLERS
// ============================================

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listBooks(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getOne(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const book = await getBookById(id);
    res.json({ book });
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = createBookSchema.parse(req.body);
    const book = await createBook(input);
    res.status(201).json({ message: 'Book created', book });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const input = updateBookSchema.parse(req.body);
    const book = await updateBook(id, input);
    res.json({ message: 'Book updated', book });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    await deleteBook(id);
    res.json({ message: 'Book deleted' });
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
    const data = await getBookStats();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function authors(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listAuthors();
    res.json({ authors: data });
  } catch (error) {
    next(error);
  }
}

export async function readBook(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Authentication required', 401);

    const { id } = req.params;
    const book = await getBookById(id);

    if (!book.pdfUrl) {
      throw new AppError('This book has no digital file yet', 404);
    }

    // Admins can always read; customers must own the book
    if (req.user?.role !== 'admin') {
      const owns = await userOwnsBook(userId, id);
      if (!owns) {
        throw new AppError('You do not own this book', 403);
      }
    }

    res.json({
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        pdfUrl: book.pdfUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

export { createBookSchema, updateBookSchema };