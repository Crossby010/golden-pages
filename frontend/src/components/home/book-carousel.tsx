import {
  Fragment,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Star, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import type { Book } from '@/types/book';
import { cn } from '@/lib/utils';

interface BookCarouselProps {
  title: string;
  icon?: React.ReactNode;
  books: Book[];
  loading?: boolean;
  error?: string | null;
}

interface BookInstance {
  instanceId: string;
  book: Book;
}

const CAROUSEL_THRESHOLD = 4;

export function BookCarousel({
  title,
  icon,
  books: fetchedBooks,
  loading,
  error,
}: BookCarouselProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const useCarousel = fetchedBooks.length >= CAROUSEL_THRESHOLD;

  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const componentRef = useRef<HTMLDivElement | null>(null);
  const [extraInstances, setExtraInstances] = useState<BookInstance[]>([]);
  const [nextInstanceId, setNextInstanceId] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const batchCounterRef = useRef(0);

  const buildInstances = (books: Book[], prefix: string): BookInstance[] =>
    books.map((book, i) => ({
      instanceId: `${prefix}-${book.id}-${i}`,
      book,
    }));

  const baseInstances = buildInstances(fetchedBooks, 'orig');
  const items = useCarousel
    ? [...baseInstances, ...extraInstances]
    : baseInstances;

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const snapToInstance = (targetCard: HTMLElement) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setIsScrolling(true);
    const containerRect = container.getBoundingClientRect();
    const cardRect = targetCard.getBoundingClientRect();
    const padding = 16;
    const cardLeftRelative = cardRect.left - containerRect.left;
    const targetScroll = container.scrollLeft + (cardLeftRelative - padding);
    container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    setTimeout(() => setIsScrolling(false), 500);
  };

  const snapToInstanceId = useCallback((instanceId: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll(
      '.book-cover-clickable'
    ) as NodeListOf<HTMLElement>;
    let target: HTMLElement | null = null;
    cards.forEach((card) => {
      if (card.getAttribute('data-instance-id') === instanceId) {
        target = card;
      }
    });
    if (target) snapToInstance(target);
  }, []);

  const handleBookClick = (instanceId: string, clickedIndex: number) => {
    if (hasDragged) {
      setHasDragged(false);
      return;
    }

    if (activeInstanceId === instanceId && isOpen) {
      closeDescription();
      return;
    }

    setActiveInstanceId(instanceId);
    setIsOpen(true);

    if (!useCarousel) return;

    const isNearEnd = clickedIndex >= items.length - 3;
    if (isNearEnd && fetchedBooks.length > 0) {
      batchCounterRef.current += 1;
      const newBatch = buildInstances(
        fetchedBooks,
        `extra-${batchCounterRef.current}`
      );
      setExtraInstances((prev) => [...prev, ...newBatch]);
      setNextInstanceId(instanceId);
    } else {
      setTimeout(() => snapToInstanceId(instanceId), 150);
    }
  };

  useEffect(() => {
    if (!useCarousel) return;
    if (nextInstanceId !== null) {
      setTimeout(() => {
        snapToInstanceId(nextInstanceId);
        setNextInstanceId(null);
      }, 200);
    }
  }, [nextInstanceId, useCarousel, snapToInstanceId]);

  const handleAddToCart = (book: Book) => {
    addToCart(book);
    setJustAddedId(book.id);
    setTimeout(() => setJustAddedId(null), 2000);
  };

  const closeDescription = () => {
    setIsOpen(false);
    setTimeout(() => setActiveInstanceId(null), 300);
  };

  const handleClose = () => closeDescription();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!isOpen) return;
      const target = event.target as Node;
      if (componentRef.current && componentRef.current.contains(target)) {
        if (
          descriptionRef.current &&
          descriptionRef.current.contains(target)
        )
          return;
        const covers = document.querySelectorAll('.book-cover-clickable');
        let isBookCover = false;
        covers.forEach((cover) => {
          if (cover.contains(target)) isBookCover = true;
        });
        if (!isBookCover) closeDescription();
      } else {
        closeDescription();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!useCarousel) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      if (
        scrollLeft + clientWidth >= scrollWidth - 200 &&
        fetchedBooks.length > 0
      ) {
        batchCounterRef.current += 1;
        const newBatch = buildInstances(
          fetchedBooks,
          `extra-${batchCounterRef.current}`
        );
        setExtraInstances((prev) => [...prev, ...newBatch]);
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [fetchedBooks, useCarousel]);

  const activeInstance =
    activeInstanceId !== null
      ? items.find((i) => i.instanceId === activeInstanceId)
      : null;
  const activeBook = activeInstance?.book || null;

  const descriptionVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' as const },
    },
    exit: {
      opacity: 0,
      x: 20,
      scale: 0.95,
      transition: { duration: 0.2, ease: 'easeIn' as const },
    },
  };

  const coverVariants = {
    idle: { scale: 1 },
    active: { scale: 1.02, transition: { duration: 0.2 } },
  };

  const getItemWidth = () =>
    'w-[140px] sm:w-[180px] md:w-[220px] lg:w-[250px] xl:w-[280px]';

  // ===== Loading =====
  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-navy-700 flex items-center gap-2">
            {icon || (
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-brass-500" />
            )}
            {title}
          </h2>
        </div>
        <div className="flex gap-4 overflow-hidden px-4 sm:px-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px] animate-pulse"
            >
              <div className="aspect-[2/3] bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===== Error =====
  if (error) {
    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-navy-700 flex items-center gap-2">
            {icon || (
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-brass-500" />
            )}
            {title}
          </h2>
        </div>
        <div className="text-center py-8 px-4">
          <p className="text-red-500">Error loading books: {error}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  // ============================================
  // STATIC GRID MODE (few books)
  // ============================================
  if (!useCarousel) {
    return (
      <div ref={componentRef} className="mb-12">
        <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-navy-700 flex items-center gap-2">
            {icon || (
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-brass-500" />
            )}
            {title}
          </h2>
          <button
            onClick={() => navigate('/books')}
            className="text-xs sm:text-sm text-gray-500 hover:text-navy-700 border border-gray-200 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg transition"
          >
            Show All →
          </button>
        </div>

        <div className="flex flex-wrap gap-4 px-4 sm:px-6">
          {items.map(({ instanceId, book }) => {
            const isActive = activeInstanceId === instanceId && isOpen;
            const showDescription = isActive && activeBook;
            return (
              <Fragment key={instanceId}>
                <motion.div
                  className={`flex-shrink-0 ${getItemWidth()}`}
                  initial="idle"
                  animate={isActive ? 'active' : 'idle'}
                  variants={coverVariants}
                >
                  <div
                    onClick={() => handleBookClick(instanceId, 0)}
                    className={cn(
                      'book-cover-clickable aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 bg-gradient-to-br from-brass-100 to-brass-200 hover:shadow-lg hover:-translate-y-1 relative',
                      isActive &&
                        'ring-2 ring-navy-700 shadow-lg shadow-brass-500/20'
                    )}
                    data-instance-id={instanceId}
                    data-book-id={book.id}
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2">
                        <BookOpen className="w-8 h-8 text-brass-500 mb-2" />
                        <span className="text-[10px] sm:text-xs md:text-sm font-bold text-center line-clamp-2">
                          {book.title}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>

                <AnimatePresence mode="wait">
                  {showDescription && (
                    <motion.div
                      ref={descriptionRef}
                      className={`flex-shrink-0 ${getItemWidth()} bg-cream rounded-xl p-3 sm:p-4 md:p-5 border border-brass-100 relative`}
                      variants={descriptionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <button
                        onClick={handleClose}
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 text-gray-400 hover:text-gray-700 transition"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>

                      <div className="pr-4 sm:pr-6">
                        <motion.h3
                          className="text-xs sm:text-sm md:text-base lg:text-lg font-serif font-bold text-navy-700 line-clamp-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          {book.title}
                        </motion.h3>
                        <motion.p
                          className="text-[10px] sm:text-xs md:text-sm text-gray-500"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          By {book.author}
                        </motion.p>

                        <motion.div
                          className="flex items-center gap-1 mt-1 flex-wrap"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-brass-500 fill-brass-500" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-medium">
                            {book.rating}
                          </span>
                          <span className="text-[8px] sm:text-[10px] text-gray-400">
                            ({book.reviews})
                          </span>
                        </motion.div>

                        <motion.p
                          className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 mt-1 sm:mt-2 line-clamp-3 sm:line-clamp-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                        >
                          {book.description}
                        </motion.p>

                        <motion.div
                          className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <span className="text-sm sm:text-base md:text-lg font-bold text-brass-500">
                            ₱{book.price.toFixed(2)}
                          </span>
                          <span className="text-[8px] sm:text-[10px] md:text-xs text-green-600">
                            ✓ Digital
                          </span>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                        >
                          <Button
                            onClick={() => handleAddToCart(book)}
                            className={`mt-1.5 sm:mt-2 w-full text-white text-[10px] sm:text-xs md:text-sm py-1 sm:py-1.5 md:py-2 flex items-center justify-center gap-1 sm:gap-2 transition-colors ${
                              justAddedId === book.id
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-brass-500 hover:bg-brass-600'
                            }`}
                          >
                            {justAddedId === book.id ? (
                              <>
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                Added!
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                Add to Cart
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================
  // CAROUSEL MODE (many books)
  // ============================================
  return (
    <div ref={componentRef} className="mb-12">
      <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-navy-700 flex items-center gap-2">
          {icon || (
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-brass-500" />
          )}
          {title}
        </h2>
        <button
          onClick={() => navigate('/books')}
          className="text-xs sm:text-sm text-gray-500 hover:text-navy-700 border border-gray-200 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg transition"
        >
          Show All →
        </button>
      </div>

      <div className="relative w-full overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth pb-4 hide-scrollbar cursor-grab active:cursor-grabbing px-4 sm:px-6 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={(e) => {
            if (isScrolling) return;
            setIsDragging(true);
            setHasDragged(false);
            setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
            setScrollLeftPos(scrollContainerRef.current?.scrollLeft || 0);
            document.body.style.userSelect = 'none';
          }}
          onMouseMove={(e) => {
            if (!isDragging || !scrollContainerRef.current) return;
            e.preventDefault();
            const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
            const walk = (x - startX) * 1.5;
            if (Math.abs(walk) > 5) setHasDragged(true);
            scrollContainerRef.current.scrollLeft = scrollLeftPos - walk;
          }}
          onMouseUp={() => {
            setIsDragging(false);
            document.body.style.userSelect = '';
            setTimeout(() => setHasDragged(false), 50);
          }}
          onMouseLeave={() => {
            if (isDragging) {
              setIsDragging(false);
              document.body.style.userSelect = '';
            }
          }}
          onTouchStart={(e) => {
            if (isScrolling) return;
            setIsDragging(true);
            setHasDragged(false);
            setStartX(
              e.touches[0].pageX -
                (scrollContainerRef.current?.offsetLeft || 0)
            );
            setScrollLeftPos(scrollContainerRef.current?.scrollLeft || 0);
          }}
          onTouchMove={(e) => {
            if (!isDragging || !scrollContainerRef.current) return;
            const x =
              e.touches[0].pageX -
              (scrollContainerRef.current.offsetLeft || 0);
            const walk = (x - startX) * 1.5;
            if (Math.abs(walk) > 5) setHasDragged(true);
            scrollContainerRef.current.scrollLeft = scrollLeftPos - walk;
          }}
          onTouchEnd={() => {
            setIsDragging(false);
            setTimeout(() => setHasDragged(false), 50);
          }}
        >
          {items.map(({ instanceId, book }, index) => {
            const isActive = activeInstanceId === instanceId && isOpen;
            const showDescription = isActive && activeBook;
            return (
              <Fragment key={instanceId}>
                <motion.div
                  className={`flex-shrink-0 ${getItemWidth()}`}
                  initial="idle"
                  animate={isActive ? 'active' : 'idle'}
                  variants={coverVariants}
                >
                  <div
                    onClick={() => handleBookClick(instanceId, index)}
                    className={cn(
                      'book-cover-clickable aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 bg-gradient-to-br from-brass-100 to-brass-200 hover:shadow-lg hover:-translate-y-1 hover:z-10 relative',
                      isActive &&
                        'ring-2 ring-navy-700 shadow-lg shadow-brass-500/20'
                    )}
                    data-instance-id={instanceId}
                    data-book-id={book.id}
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2">
                        <BookOpen className="w-8 h-8 text-brass-500 mb-2" />
                        <span className="text-[10px] sm:text-xs md:text-sm font-bold text-center line-clamp-2">
                          {book.title}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>

                <AnimatePresence mode="wait">
                  {showDescription && (
                    <motion.div
                      ref={descriptionRef}
                      className={`flex-shrink-0 ${getItemWidth()} bg-cream rounded-xl p-3 sm:p-4 md:p-5 border border-brass-100 relative`}
                      variants={descriptionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <button
                        onClick={handleClose}
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 text-gray-400 hover:text-gray-700 transition"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>

                      <div className="pr-4 sm:pr-6">
                        <motion.h3
                          className="text-xs sm:text-sm md:text-base lg:text-lg font-serif font-bold text-navy-700 line-clamp-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          {book.title}
                        </motion.h3>
                        <motion.p
                          className="text-[10px] sm:text-xs md:text-sm text-gray-500"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          By {book.author}
                        </motion.p>

                        <motion.div
                          className="flex items-center gap-1 mt-1 flex-wrap"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-brass-500 fill-brass-500" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-medium">
                            {book.rating}
                          </span>
                          <span className="text-[8px] sm:text-[10px] text-gray-400">
                            ({book.reviews})
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-brass-100 text-brass-700 text-[6px] sm:text-[8px] md:text-[10px] px-1.5 sm:px-2"
                          >
                            Bestseller
                          </Badge>
                        </motion.div>

                        <motion.p
                          className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 mt-1 sm:mt-2 line-clamp-3 sm:line-clamp-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                        >
                          {book.description}
                        </motion.p>

                        <motion.div
                          className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <span className="text-sm sm:text-base md:text-lg font-bold text-brass-500">
                            ₱{book.price.toFixed(2)}
                          </span>
                          <span className="text-[8px] sm:text-[10px] md:text-xs text-green-600">
                            ✓ Digital
                          </span>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                        >
                          <Button
                            onClick={() => handleAddToCart(book)}
                            className={`mt-1.5 sm:mt-2 w-full text-white text-[10px] sm:text-xs md:text-sm py-1 sm:py-1.5 md:py-2 flex items-center justify-center gap-1 sm:gap-2 transition-colors ${
                              justAddedId === book.id
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-brass-500 hover:bg-brass-600'
                            }`}
                          >
                            {justAddedId === book.id ? (
                              <>
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                Added!
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                Add to Cart
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
