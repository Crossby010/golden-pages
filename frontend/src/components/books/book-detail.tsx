import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Check,
  BookOpen,
  Loader2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bookService } from '@/services/book-service';
import { reviewService, type BookReviewsResponse } from '@/services/review-service';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/order-utils';
import type { Book } from '@/types/book';

export function BookDetail() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { success, info } = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<BookReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!bookId) {
        if (!cancelled) {
          setError('Book ID missing');
          setLoading(false);
        }
        return;
      }

      try {
        const data = await bookService.getById(bookId);
        if (!cancelled) setBook(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      if (!bookId) return;
      try {
        const data = await reviewService.listForBook(bookId);
        if (!cancelled) setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    }

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const handleAddToCart = () => {
    if (!book) return;
    addToCart(book);
    setJustAdded(true);
    success(`${book.title} added to cart`);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleSubmitReview = async () => {
    if (!book) return;
    if (!user) {
      info('Please sign in to leave a review');
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.create({
        bookId: book.id,
        rating: reviewRating,
        comment: reviewComment,
      });

      // Reload reviews
      const updated = await reviewService.listForBook(book.id);
      setReviews(updated);

      // Reload book to get updated rating
      const updatedBook = await bookService.getById(book.id);
      setBook(updatedBook);

      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      success('Review submitted!');
    } catch (err) {
      info(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Loader2 className="w-8 h-8 text-brass-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading book...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-navy-700 mb-2">
          Book not found
        </h1>
        <p className="text-gray-500 mb-6">
          {error || 'The book you are looking for does not exist.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="h-11">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Link to="/books">
            <Button className="bg-brass-500 hover:bg-brass-600 text-white h-11">
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
      <Link
        to="/books"
        className="text-sm text-gray-500 hover:text-navy-700 transition-colors inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Books
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cover */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-xs aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-brass-100 to-brass-200 shadow-lg">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-brass-500" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <Badge variant="secondary" className="bg-brass-100 text-brass-700 mb-3">
            {book.category}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy-700 mb-2">
            {book.title}
          </h1>
          <p className="text-lg text-gray-500 mb-4">By {book.author}</p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-brass-500 fill-brass-500" />
              <span className="font-medium">{book.rating}</span>
              <span className="text-sm text-gray-400">
                ({book.reviews} reviews)
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-brass-500">
              ₱{book.price.toFixed(2)}
            </span>
            <span className="text-sm text-green-600">✓ Available (Digital)</span>
          </div>

          <div className="flex gap-3 mb-6">
            <Button
              onClick={handleAddToCart}
              size="lg"
              className={`flex-1 h-12 text-white transition-colors ${
                justAdded
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-brass-500 hover:bg-brass-600'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 py-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Pages
              </p>
              <p className="text-sm font-medium text-navy-700">
                {book.pages || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Publisher
              </p>
              <p className="text-sm font-medium text-navy-700">
                {book.publisher || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Year
              </p>
              <p className="text-sm font-medium text-navy-700">
                {book.publishedYear || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Format
              </p>
              <p className="text-sm font-medium text-navy-700">Digital</p>
            </div>
          </div>

          {/* Description */}
          <div className="pt-6 border-t border-gray-100">
            <h2 className="text-lg font-serif font-bold text-navy-700 mb-3">
              About This Book
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {book.description || 'No description available.'}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-serif font-bold text-navy-700 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brass-500" />
              Customer Reviews
            </h2>
            {reviews && reviews.totalReviews > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {reviews.totalReviews}{' '}
                {reviews.totalReviews === 1 ? 'review' : 'reviews'} • Average{' '}
                {reviews.averageRating} ⭐
              </p>
            )}
          </div>
          {user && (
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              variant="outline"
              className="border-gray-200"
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </Button>
          )}
        </div>

        {showReviewForm && (
          <div className="bg-cream rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-navy-700 mb-4">
              Your Review
            </h3>
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="text-2xl transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    {star <= reviewRating ? (
                      <Star className="w-7 h-7 text-brass-500 fill-brass-500" />
                    ) : (
                      <Star className="w-7 h-7 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Comment (optional)</p>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your thoughts about this book..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy-700 resize-none bg-white"
              />
            </div>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="bg-brass-500 hover:bg-brass-600 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        )}

        {reviewsLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 text-brass-500 animate-spin mx-auto" />
          </div>
        ) : reviews && reviews.reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brass-100 to-brass-200 flex items-center justify-center text-sm font-bold text-brass-600 flex-shrink-0">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium text-navy-700 text-sm">
                        {review.userName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating
                              ? 'text-brass-500 fill-brass-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No reviews yet. Be the first to review!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
