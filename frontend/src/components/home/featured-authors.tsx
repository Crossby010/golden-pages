import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, ArrowRight, BookOpen } from 'lucide-react';
import { bookService, type AuthorSummary } from '@/services/book-service';

export function FeaturedAuthors() {
  const [authors, setAuthors] = useState<AuthorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await bookService.getAuthors();
        if (!cancelled) setAuthors(data);
      } catch (err) {
        console.error('Failed to load authors:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const topAuthors = authors.slice(0, 8);

  return (
    <div className="hidden lg:block w-[240px] flex-shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-serif font-bold text-navy-700 flex items-center gap-2">
          <User className="w-4 h-4 text-brass-500" />
          Featured Authors
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded w-24 mb-1.5 animate-pulse" />
                <div className="h-2 bg-gray-100 rounded w-16 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : topAuthors.length === 0 ? (
        <div className="text-center py-6 px-2">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No authors yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topAuthors.map((author) => (
            <Link
              key={author.name}
              to={`/books?search=${encodeURIComponent(author.name)}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brass-100 to-brass-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {author.topBook?.coverUrl ? (
                  <img
                    src={author.topBook.coverUrl}
                    alt={author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-brass-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-700 truncate group-hover:text-navy-700 transition-colors">
                  {author.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {author.bookCount} {author.bookCount === 1 ? 'book' : 'books'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        to="/authors"
        className="flex items-center justify-center gap-2 mt-4 text-xs text-brass-500 hover:text-brass-600 transition-colors"
      >
        View All Authors
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
