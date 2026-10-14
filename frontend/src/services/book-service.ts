import { api } from '@/lib/api';
import type {
  Book,
  BookListResponse,
  BookStats,
  CreateBookInput,
  ListBooksParams,
  UpdateBookInput,
} from '@/types/book';

export interface AuthorSummary {
  name: string;
  bookCount: number;
  topBook: {
    id: string;
    title: string;
    coverUrl: string;
  } | null;
}

export interface ReadableBook {
  id: string;
  title: string;
  author: string;
  pdfUrl: string;
}

export const bookService = {
  // ============================================
  // PUBLIC
  // ============================================

  async list(params: ListBooksParams = {}): Promise<BookListResponse> {
    const { data } = await api.get<BookListResponse>('/books', { params });
    return data;
  },

  async getById(id: string): Promise<Book> {
    const { data } = await api.get<{ book: Book }>(`/books/${id}`);
    return data.book;
  },

  async getStats(): Promise<BookStats> {
    const { data } = await api.get<BookStats>('/books/stats');
    return data;
  },

  async getAuthors(): Promise<AuthorSummary[]> {
    const { data } = await api.get<{ authors: AuthorSummary[] }>(
      '/books/authors'
    );
    return data.authors;
  },

  async getReadUrl(id: string): Promise<ReadableBook> {
    const { data } = await api.get<{ book: ReadableBook }>(
      `/books/${id}/read`
    );
    return data.book;
  },

  // ============================================
  // ADMIN
  // ============================================

  async create(input: CreateBookInput): Promise<Book> {
    const { data } = await api.post<{ message: string; book: Book }>(
      '/books',
      input
    );
    return data.book;
  },

  async update(id: string, input: UpdateBookInput): Promise<Book> {
    const { data } = await api.patch<{ message: string; book: Book }>(
      `/books/${id}`,
      input
    );
    return data.book;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/books/${id}`);
  },

  // ============================================
  // UPLOAD
  // ============================================

  async uploadCover(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>(
      '/books/upload/cover',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.url;
  },

  async uploadPdf(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>(
      '/books/upload/pdf',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.url;
  },
};