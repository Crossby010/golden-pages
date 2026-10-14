import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, BookOpen, Loader2 } from 'lucide-react';
import { bookService, type AuthorSummary } from '@/services/book-service';

export function AuthorsPage() {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700 flex items-center gap-2">
          <User className="w-6 h-6 text-brass-500" />
          All Authors
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? 'Loading...' : `${authors.length} ${authors.length === 1 ? 'author' : 'authors'}`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-brass-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading authors...</p>
        </div>
      ) : authors.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No authors yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {authors.map((author) => (
            <Link
              key={author.name}
              to={`/books?search=${encodeURIComponent(author.name)}`}
              className="flex items-center gap-4 p-4 bg-cream rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-navy-300 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brass-100 to-brass-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {author.topBook?.coverUrl ? (
                  <img
                    src={author.topBook.coverUrl}
                    alt={author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-brass-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif font-bold text-navy-700 truncate group-hover:text-navy-700 transition-colors">
                  {author.name}
                </p>
                <p className="text-xs text-gray-500">
                  {author.bookCount} {author.bookCount === 1 ? 'book' : 'books'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
