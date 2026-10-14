import { BookOpen } from 'lucide-react';
import { BookCarousel } from './book-carousel';
import { useBooks, useBooksByIds } from '@/hooks/use-books';
import { getHomepageSettings } from '@/lib/admin-utils';

export function FeaturedBooks() {
  const settings = getHomepageSettings();
  const hasSelection = settings.featuredBookIds.length > 0;

  // If admin picked specific books, use those. Otherwise, use `isFeatured` flag.
  const byFlag = useBooks('featured');
  const byIds = useBooksByIds(hasSelection ? settings.featuredBookIds : []);

  const { books, loading, error } = hasSelection ? byIds : byFlag;

  return (
    <BookCarousel
      title="Featured Books"
      icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-brass-500" />}
      books={books}
      loading={loading}
      error={error}
    />
  );
}
