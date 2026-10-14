import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Filter,
  Loader2,
  Upload,
  Image as ImageIcon,
  FileText,
  Check,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { bookService } from '@/services/book-service';
import { getErrorMessage } from '@/lib/api';
import type { Book, CreateBookInput } from '@/types/book';
import { cn } from '@/lib/utils';

type ModalMode = 'add' | 'edit' | 'delete' | null;

const emptyBook: CreateBookInput = {
  title: '',
  author: '',
  description: '',
  price: 0,
  coverUrl: '',
  category: '',
  pages: 0,
  publisher: '',
  publishedYear: new Date().getFullYear(),
  isFeatured: false,
  isPopular: false,
  isNew: false,
};

const categories = [
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

export function BooksManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize search from URL (lazy — no setState in effect)
  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get('q') || ''
  );

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentBook, setCurrentBook] = useState<CreateBookInput>(emptyBook);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Clear URL param after first render (no setState — safe)
  useEffect(() => {
    if (searchParams.get('q')) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load books
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await bookService.list({ limit: 50 });
        if (!cancelled) setBooks(res.books);
      } catch (err) {
        if (!cancelled) console.error('Failed to load books:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBooks = useMemo(() => {
    let filtered = [...books];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((b) => b.category === categoryFilter);
    }
    return filtered;
  }, [books, searchQuery, categoryFilter]);

  const openAdd = () => {
    setCurrentBook(emptyBook);
    setEditingId(null);
    setErrors({});
    setApiError(null);
    setModalMode('add');
  };

  const openEdit = (book: Book) => {
    setCurrentBook({
      title: book.title,
      author: book.author,
      description: book.description,
      price: book.price,
      coverUrl: book.coverUrl,
      pdfUrl: book.pdfUrl ?? undefined,
      category: book.category,
      pages: book.pages,
      publisher: book.publisher,
      publishedYear: book.publishedYear ?? undefined,
      isFeatured: book.isFeatured,
      isPopular: book.isPopular,
      isNew: book.isNew,
    });
    setEditingId(book.id);
    setErrors({});
    setApiError(null);
    setModalMode('edit');
  };

  const openDelete = (book: Book) => {
    setCurrentBook({
      title: book.title,
      author: book.author,
      price: book.price,
      category: book.category,
    });
    setEditingId(book.id);
    setApiError(null);
    setModalMode('delete');
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!currentBook.title?.trim()) newErrors.title = 'Title is required';
    if (!currentBook.author?.trim()) newErrors.author = 'Author is required';
    if (!currentBook.category) newErrors.category = 'Category is required';
    if (!currentBook.price || currentBook.price <= 0)
      newErrors.price = 'Price must be greater than 0';
    if (!currentBook.coverUrl?.trim())
      newErrors.coverUrl = 'Cover image is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setApiError(null);
    try {
      if (modalMode === 'add') {
        const created = await bookService.create(currentBook);
        setBooks([...books, created]);
      } else if (modalMode === 'edit' && editingId) {
        const updated = await bookService.update(editingId, currentBook);
        setBooks(books.map((b) => (b.id === editingId ? updated : b)));
      }
      setModalMode(null);
      setCurrentBook(emptyBook);
      setEditingId(null);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setSaving(true);
    setApiError(null);
    try {
      await bookService.remove(editingId);
      setBooks(books.filter((b) => b.id !== editingId));
      setModalMode(null);
      setEditingId(null);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setApiError(null);
    try {
      const url = await bookService.uploadCover(file);
      setCurrentBook((prev) => ({ ...prev, coverUrl: url }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.coverUrl;
        return next;
      });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    setApiError(null);
    try {
      const url = await bookService.uploadPdf(file);
      setCurrentBook((prev) => ({ ...prev, pdfUrl: url }));
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-700">
            Books Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {books.length} {books.length === 1 ? 'book' : 'books'} in catalog
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-brass-500 hover:bg-brass-600 text-white h-10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Book
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy-700 bg-white min-w-[180px]"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-brass-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading books...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      Book
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                      Category
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      Price
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">
                      Rating
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                            {book.coverUrl ? (
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BookOpen className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-navy-700 line-clamp-1">
                              {book.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              By {book.author}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge
                          variant="secondary"
                          className="bg-brass-100 text-brass-700 text-xs"
                        >
                          {book.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-brass-500">
                          ₱{book.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-navy-700">
                          ⭐ {book.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(book)}
                            className="w-8 h-8 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-colors"
                            aria-label="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDelete(book)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredBooks.length === 0 && (
              <div className="py-16 text-center">
                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No books found</p>
              </div>
            )}
          </>
        )}
      </div>

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setModalMode(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between p-4 sm:p-5 z-10">
              <div className="flex items-center gap-2">
                {modalMode === 'add' && <Plus className="w-5 h-5 text-brass-500" />}
                {modalMode === 'edit' && <Edit className="w-5 h-5 text-brass-500" />}
                {modalMode === 'delete' && <Trash2 className="w-5 h-5 text-red-500" />}
                <h2 className="text-lg font-serif font-bold text-navy-700">
                  {modalMode === 'add' && 'Add New Book'}
                  {modalMode === 'edit' && 'Edit Book'}
                  {modalMode === 'delete' && 'Delete Book'}
                </h2>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMode === 'delete' && (
              <div className="p-5 sm:p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-navy-700 mb-2">
                    Are you sure?
                  </h3>
                  <p className="text-sm text-gray-500">
                    You're about to delete <strong>{currentBook.title}</strong>. This
                    action cannot be undone.
                  </p>
                </div>

                {apiError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs text-red-600">{apiError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setModalMode(null)}
                    className="flex-1 h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Book
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {(modalMode === 'add' || modalMode === 'edit') && (
              <div className="p-5 sm:p-6 space-y-4">
                {/* Cover Upload */}
                <div className="p-4 bg-cream rounded-xl">
                  <Label className="text-sm font-medium text-navy-700 mb-3 block">
                    Cover Image *
                  </Label>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-36 flex-shrink-0 rounded-lg bg-white border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
                      {currentBook.coverUrl ? (
                        <img
                          src={currentBook.coverUrl}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                        className={cn('w-full', errors.coverUrl && 'border-red-400')}
                      >
                        {uploadingCover ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : currentBook.coverUrl ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-500" />
                            Replace Cover
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Cover Image
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, or WebP • Recommended 600×900 (2:3 ratio)
                      </p>
                      {errors.coverUrl && (
                        <p className="text-xs text-red-500">{errors.coverUrl}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={currentBook.title}
                    onChange={(e) =>
                      setCurrentBook({ ...currentBook, title: e.target.value })
                    }
                    placeholder="Noli Me Tangere"
                    className={errors.title ? 'border-red-400' : ''}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* Author */}
                <div className="space-y-1.5">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={currentBook.author}
                    onChange={(e) =>
                      setCurrentBook({ ...currentBook, author: e.target.value })
                    }
                    placeholder="Jose Rizal"
                    className={errors.author ? 'border-red-400' : ''}
                  />
                  {errors.author && (
                    <p className="text-xs text-red-500">{errors.author}</p>
                  )}
                </div>

                {/* Category + Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={currentBook.category}
                      onChange={(e) =>
                        setCurrentBook({ ...currentBook, category: e.target.value })
                      }
                      className={cn(
                        'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-navy-700 bg-white',
                        errors.category ? 'border-red-400' : 'border-gray-200'
                      )}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-xs text-red-500">{errors.category}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="price">Price (₱) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={currentBook.price}
                      onChange={(e) =>
                        setCurrentBook({
                          ...currentBook,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="250"
                      className={errors.price ? 'border-red-400' : ''}
                    />
                    {errors.price && (
                      <p className="text-xs text-red-500">{errors.price}</p>
                    )}
                  </div>
                </div>

                {/* Publisher + Year + Pages */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      value={currentBook.publisher}
                      onChange={(e) =>
                        setCurrentBook({
                          ...currentBook,
                          publisher: e.target.value,
                        })
                      }
                      placeholder="Anvil Press"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={currentBook.publishedYear}
                      onChange={(e) =>
                        setCurrentBook({
                          ...currentBook,
                          publishedYear: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="2024"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pages">Pages</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={currentBook.pages}
                      onChange={(e) =>
                        setCurrentBook({
                          ...currentBook,
                          pages: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="320"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={currentBook.description}
                    onChange={(e) =>
                      setCurrentBook({
                        ...currentBook,
                        description: e.target.value,
                      })
                    }
                    placeholder="Book description..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy-700 resize-none"
                  />
                </div>

                {/* PDF Upload */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Digital Book File
                        </p>
                        <p className="text-xs text-blue-700">
                          {currentBook.pdfUrl
                            ? 'Uploaded ✓'
                            : 'PDF or EPUB (up to 50 MB)'}
                        </p>
                      </div>
                    </div>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,application/epub+zip"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={uploadingPdf}
                      className="border-blue-200"
                    >
                      {uploadingPdf ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : currentBook.pdfUrl ? (
                        <>
                          <Upload className="w-3 h-3 mr-2" />
                          Replace
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 mr-2" />
                          Upload PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentBook.isFeatured}
                      onChange={(e) =>
                        setCurrentBook({
                          ...currentBook,
                          isFeatured: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-brass-500 focus:ring-navy-700"
                    />
                    <span className="text-sm text-navy-700">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentBook.isPopular}
                      onChange={(e) =>
                        setCurrentBook({
                          ...currentBook,
                          isPopular: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-brass-500 focus:ring-navy-700"
                    />
                    <span className="text-sm text-navy-700">Popular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentBook.isNew}
                      onChange={(e) =>
                        setCurrentBook({
                          ...currentBook,
                          isNew: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-brass-500 focus:ring-navy-700"
                    />
                    <span className="text-sm text-navy-700">New Arrival</span>
                  </label>
                </div>

                {apiError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs text-red-600">{apiError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setModalMode(null)}
                    className="flex-1 h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || uploadingCover || uploadingPdf}
                    className="flex-1 h-11 bg-brass-500 hover:bg-brass-600 text-white"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {modalMode === 'add' ? 'Add Book' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
