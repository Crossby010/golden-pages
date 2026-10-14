import { sql } from '../config/database.js';
import { redis } from '../config/redis.js';
import { AppError } from '../middleware/error-handler.js';

// ============================================
// TYPES
// ============================================

export interface DbBook {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  cover_url: string;
  pdf_url: string | null;
  category: string;
  pages: number;
  publisher: string;
  published_year: number | null;
  rating: number;
  reviews: number;
  stock: number;
  is_digital: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface SafeBook {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  coverUrl: string;
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

export interface ListOptions {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
  sort?: 'recent' | 'title' | 'author' | 'price-asc' | 'price-desc' | 'rating';
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

export interface AuthorSummary {
  name: string;
  bookCount: number;
  topBook: {
    id: string;
    title: string;
    coverUrl: string;
  } | null;
}

// ============================================
// HELPERS
// ============================================

function toSafeBook(b: DbBook): SafeBook {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    description: b.description,
    price: Number(b.price),
    coverUrl: b.cover_url,
    pdfUrl: b.pdf_url,
    category: b.category,
    pages: b.pages,
    publisher: b.publisher,
    publishedYear: b.published_year,
    rating: Number(b.rating),
    reviews: b.reviews,
    stock: b.stock,
    isDigital: b.is_digital,
    isFeatured: b.is_featured,
    isPopular: b.is_popular,
    isNew: b.is_new,
    createdAt: b.created_at,
  };
}

const CACHE_TTL = 60 * 5;

// ============================================
// LIST
// ============================================

export async function listBooks(
  opts: ListOptions = {}
): Promise<{ books: SafeBook[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(50, Math.max(1, opts.limit || 20));
  const offset = (page - 1) * limit;

  const cacheKey = `books:list:${JSON.stringify(opts)}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return cached as {
      books: SafeBook[];
      total: number;
      page: number;
      limit: number;
    };
  }

  const allRows = (await sql`
    SELECT * FROM books ORDER BY created_at DESC
  `) as DbBook[];

  let filtered = allRows;

  if (opts.category) {
    filtered = filtered.filter((b) => b.category === opts.category);
  }
  if (opts.featured) {
    filtered = filtered.filter((b) => b.is_featured);
  }
  if (opts.popular) {
    filtered = filtered.filter((b) => b.is_popular);
  }
  if (opts.isNew) {
    filtered = filtered.filter((b) => b.is_new);
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }

  switch (opts.sort) {
    case 'title':
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'author':
      filtered.sort((a, b) => a.author.localeCompare(b.author));
      break;
    case 'price-asc':
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case 'price-desc':
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case 'rating':
      filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
      break;
    case 'recent':
    default:
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  const result = {
    books: paged.map(toSafeBook),
    total,
    page,
    limit,
  };

  await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL });
  return result;
}

// ============================================
// GET ONE
// ============================================

export async function getBookById(id: string): Promise<SafeBook> {
  const cacheKey = `books:item:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached as SafeBook;

  const rows = (await sql`
    SELECT * FROM books WHERE id = ${id} LIMIT 1
  `) as DbBook[];

  if (rows.length === 0) {
    throw new AppError('Book not found', 404);
  }

  const book = toSafeBook(rows[0]);
  await redis.set(cacheKey, JSON.stringify(book), { ex: CACHE_TTL });
  return book;
}

// ============================================
// CACHE INVALIDATION
// ============================================

async function invalidateCache(id?: string): Promise<void> {
  const keys = await redis.keys('books:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  if (id) {
    await redis.del(`books:item:${id}`);
  }
}

// ============================================
// CREATE
// ============================================

export async function createBook(input: CreateBookInput): Promise<SafeBook> {
  const rows = (await sql`
    INSERT INTO books (
      title, author, description, price, cover_url, pdf_url,
      category, pages, publisher, published_year,
      is_featured, is_popular, is_new
    ) VALUES (
      ${input.title},
      ${input.author},
      ${input.description || ''},
      ${input.price},
      ${input.coverUrl || ''},
      ${input.pdfUrl || null},
      ${input.category},
      ${input.pages || 0},
      ${input.publisher || ''},
      ${input.publishedYear || null},
      ${input.isFeatured || false},
      ${input.isPopular || false},
      ${input.isNew || false}
    )
    RETURNING *
  `) as DbBook[];

  await invalidateCache();
  return toSafeBook(rows[0]);
}

// ============================================
// UPDATE
// ============================================

export async function updateBook(
  id: string,
  input: UpdateBookInput
): Promise<SafeBook> {
  const existingRows = (await sql`
    SELECT * FROM books WHERE id = ${id} LIMIT 1
  `) as DbBook[];

  if (existingRows.length === 0) {
    throw new AppError('Book not found', 404);
  }

  const current = existingRows[0];

  const rows = (await sql`
    UPDATE books SET
      title = ${input.title ?? current.title},
      author = ${input.author ?? current.author},
      description = ${input.description ?? current.description},
      price = ${input.price ?? current.price},
      cover_url = ${input.coverUrl ?? current.cover_url},
      pdf_url = ${input.pdfUrl ?? current.pdf_url},
      category = ${input.category ?? current.category},
      pages = ${input.pages ?? current.pages},
      publisher = ${input.publisher ?? current.publisher},
      published_year = ${input.publishedYear ?? current.published_year},
      is_featured = ${input.isFeatured ?? current.is_featured},
      is_popular = ${input.isPopular ?? current.is_popular},
      is_new = ${input.isNew ?? current.is_new},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `) as DbBook[];

  await invalidateCache(id);
  return toSafeBook(rows[0]);
}

// ============================================
// DELETE
// ============================================

export async function deleteBook(id: string): Promise<void> {
  const rows = (await sql`
    DELETE FROM books WHERE id = ${id} RETURNING id
  `) as { id: string }[];

  if (rows.length === 0) {
    throw new AppError('Book not found', 404);
  }

  await invalidateCache(id);
}

// ============================================
// STATS
// ============================================

export async function getBookStats(): Promise<{
  total: number;
  featured: number;
  popular: number;
  newCount: number;
  categories: { category: string; count: number }[];
}> {
  const rows = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_featured)::int AS featured,
      COUNT(*) FILTER (WHERE is_popular)::int AS popular,
      COUNT(*) FILTER (WHERE is_new)::int AS new_count
    FROM books
  `) as {
    total: number;
    featured: number;
    popular: number;
    new_count: number;
  }[];

  const cats = (await sql`
    SELECT category, COUNT(*)::int AS count
    FROM books
    GROUP BY category
    ORDER BY count DESC
  `) as { category: string; count: number }[];

  return {
    total: rows[0].total,
    featured: rows[0].featured,
    popular: rows[0].popular,
    newCount: rows[0].new_count,
    categories: cats,
  };
}

// ============================================
// AUTHORS
// ============================================

export async function listAuthors(): Promise<AuthorSummary[]> {
  const cacheKey = 'books:authors';
  const cached = await redis.get(cacheKey);
  if (cached) return cached as AuthorSummary[];

  const allBooks = (await sql`
    SELECT id, title, author, cover_url, rating
    FROM books
    ORDER BY rating DESC
  `) as {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    rating: number;
  }[];

  const authorMap = new Map<string, AuthorSummary>();

  for (const book of allBooks) {
    const existing = authorMap.get(book.author);
    if (existing) {
      existing.bookCount += 1;
    } else {
      authorMap.set(book.author, {
        name: book.author,
        bookCount: 1,
        topBook: {
          id: book.id,
          title: book.title,
          coverUrl: book.cover_url,
        },
      });
    }
  }

  const authors = Array.from(authorMap.values()).sort(
    (a, b) => b.bookCount - a.bookCount
  );

  await redis.set(cacheKey, JSON.stringify(authors), { ex: CACHE_TTL });
  return authors;
}