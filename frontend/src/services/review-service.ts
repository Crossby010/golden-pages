import { api } from '@/lib/api';

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface BookReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { [key: number]: number };
}

export const reviewService = {
  async listForBook(bookId: string): Promise<BookReviewsResponse> {
    const { data } = await api.get<BookReviewsResponse>(
      `/reviews/book/${bookId}`
    );
    return data;
  },

  async create(input: {
    bookId: string;
    rating: number;
    comment?: string;
  }): Promise<Review> {
    const { data } = await api.post<{ message: string; review: Review }>(
      '/reviews',
      input
    );
    return data.review;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/reviews/${id}`);
  },
};