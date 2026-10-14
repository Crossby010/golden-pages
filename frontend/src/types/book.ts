export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  coverUrl: string;
  coverEmoji?: string;
  pdfUrl: string | null;
  category: string;
  pages: number;
  publisher: string;
  publishedYear: number | null;
  rating: number;
  reviews: number;
  stock: number;
  isDigital: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  createdAt: string;
}

export interface BookListResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
}

export interface ListBooksParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
  sort?: 'recent' | 'title' | 'author' | 'price-asc' | 'price-desc' | 'rating';
}

export interface BookStats {
  total: number;
  featured: number;
  popular: number;
  newCount: number;
  categories: { category: string; count: number }[];
}

export interface CreateBookInput {
  title: string;
  author: string;
  description?: string;
  price: number;
  coverUrl?: string;
  pdfUrl?: string;
  category: string;
  pages?: number;
  publisher?: string;
  publishedYear?: number;
  isFeatured?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
}

export type UpdateBookInput = Partial<CreateBookInput>;