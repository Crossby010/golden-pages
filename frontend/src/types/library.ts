import type { Book } from './book';

export interface LibraryBook {
  book: Book;
  purchasedAt: string;
  orderNumber: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  progress?: number;
  isFavorite?: boolean;
}

export interface DownloadFormat {
  id: 'pdf' | 'epub' | 'mobi';
  name: string;
  description: string;
  size: string;
}