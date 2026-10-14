import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Maximize2,
  Download,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookService, type ReadableBook } from '@/services/book-service';
import { getErrorMessage } from '@/lib/api';

export function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<ReadableBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const data = await bookService.getReadUrl(bookId);
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
    if (!book) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [book]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleDownload = () => {
    if (!book) return;
    window.open(book.pdfUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brass-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-navy-700 mb-2">
            Can't open this book
          </h1>
          <p className="text-gray-500 mb-6">{error || 'Book not found'}</p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Link to="/my-library">
              <Button className="bg-brass-500 hover:bg-brass-600 text-white h-11">
                <BookOpen className="w-4 h-4 mr-2" />
                My Library
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 shrink-0">
        <Link
          to="/my-library"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Library</span>
        </Link>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-medium text-navy-700 truncate">
            {book.title}
          </p>
          <p className="text-xs text-gray-500 truncate">By {book.author}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="border-gray-200 h-9 text-xs"
          >
            <Download className="w-3.5 h-3.5 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>

          <a
            href={book.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 h-9"
              aria-label="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="border-gray-200 h-9"
            aria-label="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-gray-200 relative overflow-hidden">
        <iframe
          src={book.pdfUrl}
          title={book.title}
          className="absolute inset-0 w-full h-full border-0 bg-white"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
