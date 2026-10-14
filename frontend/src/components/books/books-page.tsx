import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  Loader2,
  BookOpen,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookCarousel } from '@/components/home/book-carousel';
import { bookService } from '@/services/book-service';
import type { Book } from '@/types/book';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Literary Fiction',
  'Crime Fiction',
  'Historical Fiction',
  'Political Fiction',
  'Autobiography',
  'Romance',
  'Sci-Fi',
  'Self-Help',
  'Children',
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'author', label: 'Author (A-Z)' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'rating', label: 'Top Rated' },
];

export function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL (lazy — safe with React Compiler)
  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get('search') || ''
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(
    () => searchParams.get('category') || null
  );
  const [sortBy, setSortBy] = useState<string>(
    () => searchParams.get('sort') || 'recent'
  );
  const [showFilters, setShowFilters] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load books
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await bookService.list({ limit: 50 });
        if (!cancelled) setBooks(res.books);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load books');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (activeCategory) params.category = activeCategory;
    if (sortBy !== 'recent') params.sort = sortBy;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeCategory, sortBy]);

  // Filter + sort
  const filteredBooks = useMemo(() => {
    let filtered = [...books];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    if (activeCategory) {
      filtered = filtered.filter((b) => b.category === activeCategory);
    }

    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'author':
        filtered.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return filtered;
  }, [books, searchQuery, activeCategory, sortBy]);

  const hasActiveFilters = !!searchQuery.trim() || !!activeCategory;

  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory(null);
    setSortBy('recent');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700">
              All Books
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Loading...' : `${filteredBooks.length} ${filteredBooks.length === 1 ? 'book' : 'books'} found`}
            </p>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by title, author, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy-700 bg-white"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'border-gray-200 lg:hidden',
                hasActiveFilters && 'border-navy-700 text-brass-500'
              )}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-gray-500">Active:</span>
            {searchQuery && (
              <Badge
                variant="secondary"
                className="bg-brass-100 text-brass-700 flex items-center gap-1"
              >
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-navy-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {activeCategory && (
              <Badge
                variant="secondary"
                className="bg-brass-100 text-brass-700 flex items-center gap-1"
              >
                {activeCategory}
                <button
                  onClick={() => setActiveCategory(null)}
                  className="hover:text-navy-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside
          className={cn(
            'w-full lg:w-56 lg:block flex-shrink-0',
            showFilters ? 'block' : 'hidden lg:block'
          )}
        >
          <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-serif font-bold text-navy-700 flex items-center gap-2">
                <Filter className="w-4 h-4 text-brass-500" />
                Categories
              </h2>
              {activeCategory && (
                <button
                  onClick={() => setActiveCategory(null)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'text-left text-sm px-3 py-2 rounded-lg transition-colors',
                  !activeCategory
                    ? 'bg-brass-500 text-white'
                    : 'text-gray-600 hover:bg-navy-50 hover:text-brass-600'
                )}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'text-left text-sm px-3 py-2 rounded-lg transition-colors',
                    activeCategory === cat
                      ? 'bg-brass-500 text-white'
                      : 'text-gray-600 hover:bg-navy-50 hover:text-brass-600'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Books grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-brass-500 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500">Loading books...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-navy-700 mb-2">
                No books found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Try adjusting your search or filters
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-gray-200"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredBooks.map((book) => (
                  <Link
                    key={book.id}
                    to={`/books/${book.id}`}
                    className="group"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-brass-100 to-brass-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2">
                          <BookOpen className="w-8 h-8 text-brass-500 mb-2" />
                          <span className="text-[10px] sm:text-xs font-bold text-center line-clamp-2">
                            {book.title}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 px-0.5">
                      <h3 className="text-sm font-medium text-navy-700 line-clamp-2 leading-tight group-hover:text-navy-700 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {book.author}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-brass-500">
                          ₱{book.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ⭐ {book.rating}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Book Carousel hint */}
              {filteredBooks.length >= 4 && (
                <div className="mt-12">
                  <BookCarousel
                    title="You Might Also Like"
                    books={filteredBooks.slice(0, 8)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
