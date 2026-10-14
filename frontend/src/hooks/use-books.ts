import { useState, useEffect } from 'react';
import { bookService } from '@/services/book-service';
import type { Book, ListBooksParams } from '@/types/book';

type BookType = 'all' | 'featured' | 'popular' | 'new';

interface UseBooksResult {
  books: Book[];
  loading: boolean;
  error: string | null;
}

export function useBooks(
  type: BookType = 'all',
  extraParams: ListBooksParams = {}
): UseBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify({ type, ...extraParams });

  useEffect(() => {
    let cancelled = false;

    async function fetchBooks() {
      setLoading(true);
      setError(null);
      try {
        const params: ListBooksParams = { ...extraParams };
        if (type === 'featured') params.featured = true;
        if (type === 'popular') params.popular = true;
        if (type === 'new') params.isNew = true;

        const res = await bookService.list(params);
        if (!cancelled) setBooks(res.books);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load books');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBooks();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return { books, loading, error };
}

// ============================================
// NEW: Fetch specific books by IDs
// ============================================

export function useBooksByIds(ids: string[]): UseBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const idsKey = JSON.stringify(ids);

  useEffect(() => {
    let cancelled = false;

    async function fetchBooks() {
      if (ids.length === 0) {
        setBooks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch each book by ID
        const results = await Promise.all(
          ids.map((id) => bookService.getById(id).catch(() => null))
        );
        const valid = results.filter((b): b is Book => b !== null);
        if (!cancelled) setBooks(valid);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load books');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBooks();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return { books, loading, error };
}