import { sql } from '../config/database.js';
import { AppError } from '../middleware/error-handler.js';

export interface DbReview {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SafeReview {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewInput {
  bookId: string;
  rating: number;
  comment?: string;
}

export interface BookReviewsResponse {
  reviews: SafeReview[];
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { [key: number]: number };
}

export async function listBookReviews(
  bookId: string
): Promise<BookReviewsResponse> {
  const rows = (await sql`
    SELECT r.*, u.name AS user_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.book_id = ${bookId}
    ORDER BY r.created_at DESC
  `) as (DbReview & { user_name: string })[];

  const reviews: SafeReview[] = rows.map((r) => ({
    id: r.id,
    bookId: r.book_id,
    userId: r.user_id,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }));

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const ratingBreakdown: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] || 0) + 1;
  });

  return {
    reviews,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingBreakdown,
  };
}

export async function createReview(
  userId: string,
  input: CreateReviewInput
): Promise<SafeReview> {
  // Verify user has purchased the book
  const purchaseRows = (await sql`
    SELECT oi.id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = ${userId}
      AND oi.book_id = ${input.bookId}
      AND o.status = 'completed'
    LIMIT 1
  `) as { id: string }[];

  if (purchaseRows.length === 0) {
    throw new AppError('You must purchase this book to leave a review', 403);
  }

  // Check if already reviewed
  const existingRows = (await sql`
    SELECT id FROM reviews
    WHERE user_id = ${userId} AND book_id = ${input.bookId}
    LIMIT 1
  `) as { id: string }[];

  if (existingRows.length > 0) {
    throw new AppError('You have already reviewed this book', 409);
  }

  const rows = (await sql`
    INSERT INTO reviews (user_id, book_id, rating, comment)
    VALUES (${userId}, ${input.bookId}, ${input.rating}, ${input.comment || ''})
    RETURNING *
  `) as DbReview[];

  // Fetch user name
  const userRows = (await sql`
    SELECT name FROM users WHERE id = ${userId} LIMIT 1
  `) as { name: string }[];

  const review = rows[0];

  // Update book's aggregate rating
  await updateBookRating(input.bookId);

  return {
    id: review.id,
    bookId: review.book_id,
    userId: review.user_id,
    userName: userRows[0]?.name || 'Anonymous',
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at,
  };
}

async function updateBookRating(bookId: string): Promise<void> {
  const rows = (await sql`
    SELECT
      AVG(rating)::numeric(3,2) AS avg_rating,
      COUNT(*)::int AS count
    FROM reviews
    WHERE book_id = ${bookId}
  `) as { avg_rating: number; count: number }[];

  const avg = rows[0]?.avg_rating || 0;
  const count = rows[0]?.count || 0;

  await sql`
    UPDATE books SET
      rating = ${avg},
      reviews = ${count}
    WHERE id = ${bookId}
  `;
}

export async function deleteReview(
  userId: string,
  reviewId: string
): Promise<void> {
  const rows = (await sql`
    DELETE FROM reviews
    WHERE id = ${reviewId} AND user_id = ${userId}
    RETURNING book_id
  `) as { book_id: string }[];

  if (rows.length === 0) {
    throw new AppError('Review not found or not yours', 404);
  }

  await updateBookRating(rows[0].book_id);
}