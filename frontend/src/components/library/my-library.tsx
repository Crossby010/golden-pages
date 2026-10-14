import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library,
  Search,
  Heart,
  Download,
  BookOpen,
  Star,
  X,
  Grid3x3,
  List,
  Filter,
  BookMarked,
  Clock,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getLibrary,
  saveLibrary,
  getLibraryFromOrders,
  incrementDownload,
  toggleFavorite,
} from '@/lib/library-utils';
import { formatDate } from '@/lib/order-utils';
import { orderService } from '@/services/order-service';
import { useAuth } from '@/hooks/use-auth';
import type { LibraryBook, DownloadFormat } from '@/types/library';
import { cn } from '@/lib/utils';

type SortOption = 'recent' | 'title' | 'author';
type FilterOption = 'all' | 'favorites' | 'reading' | 'completed';
type ViewMode = 'grid' | 'list';

const DOWNLOAD_FORMATS: DownloadFormat[] = [
  { id: 'pdf', name: 'PDF', description: 'Universal format', size: '2.4 MB' },
  { id: 'epub', name: 'EPUB', description: 'Best for e-readers', size: '1.8 MB' },
  { id: 'mobi', name: 'MOBI', description: 'Kindle format', size: '2.1 MB' },
];

export function MyLibrary() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [library, setLibrary] = useState<LibraryBook[]>(() => getLibrary());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeBook, setActiveBook] = useState<LibraryBook | null>(null);
  const [downloading, setDownloading] = useState<{ bookId: string; format: string } | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<{ bookId: string; format: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLibrary() {
      if (!isAuthenticated) {
        const cached = getLibrary();
        if (!cancelled) {
          setLibrary(cached);
          setLoading(false);
        }
        return;
      }

      try {
        const orders = await orderService.listMine();
        const fromOrders = getLibraryFromOrders(orders);
        const cached = getLibrary();
        const merged = fromOrders.map((item) => {
          const cachedItem = cached.find((c) => c.book.id === item.book.id);
          return cachedItem
            ? {
                ...item,
                downloadCount: cachedItem.downloadCount,
                lastDownloadedAt: cachedItem.lastDownloadedAt,
                progress: cachedItem.progress,
                isFavorite: cachedItem.isFavorite,
              }
            : item;
        });
        saveLibrary(merged);
        if (!cancelled) setLibrary(merged);
      } catch (err) {
        console.error('Failed to load library:', err);
        if (!cancelled) setLibrary(getLibrary());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLibrary();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const displayedBooks = useMemo(() => {
    let filtered = [...library];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.book.title.toLowerCase().includes(q) ||
          item.book.author.toLowerCase().includes(q)
      );
    }

    if (filterBy === 'favorites') {
      filtered = filtered.filter((item) => item.isFavorite);
    } else if (filterBy === 'reading') {
      filtered = filtered.filter(
        (item) => item.progress && item.progress > 0 && item.progress < 100
      );
    } else if (filterBy === 'completed') {
      filtered = filtered.filter((item) => item.progress === 100);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
      }
      if (sortBy === 'title') return a.book.title.localeCompare(b.book.title);
      if (sortBy === 'author') return a.book.author.localeCompare(b.book.author);
      return 0;
    });

    return filtered;
  }, [library, searchQuery, sortBy, filterBy]);

  const handleDownload = async (item: LibraryBook, format: DownloadFormat) => {
    if (!item.book.pdfUrl) return;

    setDownloading({ bookId: item.book.id, format: format.id });

    if (format.id === 'pdf') {
      window.open(item.book.pdfUrl, '_blank');
    } else {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    const updated = incrementDownload(item.book.id);
    setLibrary(updated);
    const updatedBook = updated.find((b) => b.book.id === item.book.id);
    if (updatedBook) setActiveBook(updatedBook);

    setDownloading(null);
    setDownloadSuccess({ bookId: item.book.id, format: format.id });
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  const handleToggleFavorite = (bookId: string) => {
    const updated = toggleFavorite(bookId);
    setLibrary(updated);
    const updatedBook = updated.find((b) => b.book.id === bookId);
    if (updatedBook) setActiveBook(updatedBook);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Loader2 className="w-8 h-8 text-brass-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading your library...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cream flex items-center justify-center">
            <Library className="w-12 h-12 text-brass-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700 mb-3">
            Sign in to view your library
          </h1>
          <p className="text-gray-500 mb-6">
            Log in to access your purchased books.
          </p>
          <Link to="/login">
            <Button className="bg-brass-500 hover:bg-brass-600 text-white h-11 px-6">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (library.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cream flex items-center justify-center">
            <Library className="w-12 h-12 text-brass-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700 mb-3">
            Your Library is Empty
          </h1>
          <p className="text-gray-500 mb-6">
            Books you purchase will appear here. Start building your digital collection!
          </p>
          <Link to="/books">
            <Button className="bg-brass-500 hover:bg-brass-600 text-white h-11 px-6">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Books
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700 flex items-center gap-2">
            <Library className="w-6 h-6 text-brass-500" />
            My Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {library.length} {library.length === 1 ? 'book' : 'books'} in your collection
          </p>
        </div>

        <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'grid' ? 'bg-brass-500 text-white' : 'text-gray-400 hover:text-gray-600'
            )}
            aria-label="Grid view"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'list' ? 'bg-brass-500 text-white' : 'text-gray-400 hover:text-gray-600'
            )}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy-700 bg-white"
          >
            <option value="recent">Recently Added</option>
            <option value="title">Title (A-Z)</option>
            <option value="author">Author (A-Z)</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy-700 bg-white"
          >
            <option value="all">All Books</option>
            <option value="favorites">Favorites</option>
            <option value="reading">Currently Reading</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {displayedBooks.length === 0 && (
        <div className="text-center py-16">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-navy-700 mb-2">No books found</h3>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {viewMode === 'grid' && displayedBooks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayedBooks.map((item) => (
            <motion.div
              key={item.book.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <div className="relative">
                <button
                  onClick={() => setActiveBook(item)}
                  className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-brass-100 to-brass-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
                >
                  {item.book.coverUrl ? (
                    <img
                      src={item.book.coverUrl}
                      alt={item.book.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <BookOpen className="w-8 h-8 text-brass-500 mb-2" />
                      <span className="text-[10px] sm:text-xs font-bold text-center line-clamp-2">
                        {item.book.title}
                      </span>
                    </div>
                  )}
                  {item.progress !== undefined && item.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <div
                        className="h-full bg-brass-500 transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleToggleFavorite(item.book.id)}
                  className={cn(
                    'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all backdrop-blur-sm',
                    item.isFavorite
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
                  )}
                  aria-label={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={cn('w-3.5 h-3.5', item.isFavorite && 'fill-current')} />
                </button>
              </div>

              <div className="mt-2 px-0.5">
                <h3 className="text-xs font-medium text-navy-700 line-clamp-2 leading-tight">
                  {item.book.title}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                  {item.book.author}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === 'list' && displayedBooks.length > 0 && (
        <div className="space-y-3">
          {displayedBooks.map((item) => (
            <motion.div
              key={item.book.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 p-3 sm:p-4 bg-cream rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setActiveBook(item)}
                className="flex-shrink-0 w-16 h-24 sm:w-20 sm:h-28 rounded-lg overflow-hidden bg-gradient-to-br from-brass-100 to-brass-200"
              >
                {item.book.coverUrl ? (
                  <img
                    src={item.book.coverUrl}
                    alt={item.book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-brass-500" />
                  </div>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-bold text-navy-700 text-sm sm:text-base line-clamp-1">
                  {item.book.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">By {item.book.author}</p>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400">
                    Added {formatDate(item.purchasedAt)}
                  </span>
                </div>

                {item.progress !== undefined && item.progress > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                      <div
                        className="h-full bg-brass-500 transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{item.progress}%</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleFavorite(item.book.id)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    item.isFavorite
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-400 hover:text-red-500'
                  )}
                  aria-label={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={cn('w-4 h-4', item.isFavorite && 'fill-current')} />
                </button>

                <Button
                  size="sm"
                  onClick={() => setActiveBook(item)}
                  className="bg-brass-500 hover:bg-brass-600 text-white h-8 px-3 text-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  Open
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeBook && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setActiveBook(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 flex justify-end p-3 z-10">
                <button
                  onClick={() => setActiveBook(null)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-shrink-0 w-32 h-48 mx-auto sm:mx-0 rounded-xl overflow-hidden bg-gradient-to-br from-brass-100 to-brass-200">
                    {activeBook.book.coverUrl ? (
                      <img
                        src={activeBook.book.coverUrl}
                        alt={activeBook.book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-brass-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy-700">
                      {activeBook.book.title}
                    </h2>
                    <p className="text-gray-500 mt-1">By {activeBook.book.author}</p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-brass-500 fill-brass-500" />
                        <span className="text-sm font-medium">{activeBook.book.rating}</span>
                        <span className="text-xs text-gray-400">
                          ({activeBook.book.reviews} reviews)
                        </span>
                      </div>
                      <Badge variant="secondary" className="bg-brass-100 text-brass-700 text-xs">
                        {activeBook.book.category}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                      {activeBook.book.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        Added {formatDate(activeBook.purchasedAt)}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <BookMarked className="w-3.5 h-3.5" />
                        Order #{activeBook.orderNumber}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-navy-700 mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4 text-brass-500" />
                    Download Book
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {DOWNLOAD_FORMATS.map((format) => {
                      const notAvailable = !activeBook.book.pdfUrl;
                      const isDownloading =
                        downloading?.bookId === activeBook.book.id &&
                        downloading?.format === format.id;
                      const isSuccess =
                        downloadSuccess?.bookId === activeBook.book.id &&
                        downloadSuccess?.format === format.id;
                      const anyDownloading = downloading?.bookId === activeBook.book.id;

                      return (
                        <button
                          key={format.id}
                          onClick={() => handleDownload(activeBook, format)}
                          disabled={anyDownloading || notAvailable}
                          className={cn(
                            'p-3 rounded-xl border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed',
                            isSuccess
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-navy-700 hover:bg-navy-50'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-navy-700 text-sm">{format.name}</span>
                            {isDownloading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-brass-500" />
                            ) : isSuccess ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Download className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{format.description}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{format.size}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={() => handleToggleFavorite(activeBook.book.id)}
                    variant="outline"
                    className={cn(
                      'flex-1 h-11 border-2',
                      activeBook.isFavorite
                        ? 'border-red-500 text-red-500 hover:bg-red-50'
                        : 'border-gray-200 hover:border-red-300 hover:text-red-500'
                    )}
                  >
                    <Heart
                      className={cn('w-4 h-4 mr-2', activeBook.isFavorite && 'fill-current')}
                    />
                    {activeBook.isFavorite ? 'Favorited' : 'Add to Favorites'}
                  </Button>

                  <Button
                    onClick={() => navigate(`/read/${activeBook.book.id}`)}
                    disabled={!activeBook.book.pdfUrl}
                    className="flex-1 bg-brass-500 hover:bg-brass-600 text-white h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {activeBook.book.pdfUrl ? 'Read Online' : 'No File Yet'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
