import { Flame } from 'lucide-react';
import { BookCarousel } from './book-carousel';
import { useBooks, useBooksByIds } from '@/hooks/use-books';
import { getHomepageSettings } from '@/lib/admin-utils';

export function PopularBooks() {
  const settings = getHomepageSettings();
  const hasSelection = settings.popularBookIds.length > 0;

  const byFlag = useBooks('popular');
  const byIds = useBooksByIds(hasSelection ? settings.popularBookIds : []);

  const { books, loading, error } = hasSelection ? byIds : byFlag;

  return (
    <BookCarousel
      title="Popular This Month"
      icon={<Flame className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-brass-500" />}
      books={books}
      loading={loading}
      error={error}
    />
  );
}
