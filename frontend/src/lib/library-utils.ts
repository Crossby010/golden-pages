import type { Order } from '@/types/order';
import type { LibraryBook } from '@/types/library';

const LIBRARY_STORAGE_KEY = 'golden-pages-library';

export function getLibraryFromOrders(orders: Order[]): LibraryBook[] {
  const library: LibraryBook[] = [];
  const seenBooks = new Set<string>();

  for (const order of orders) {
    if (order.status !== 'completed') continue;
    for (const item of order.items) {
      if (seenBooks.has(item.bookId)) continue;
      seenBooks.add(item.bookId);
      library.push({
        book: item.book,
        purchasedAt: order.createdAt,
        orderNumber: order.orderNumber,
        downloadCount: 0,
        progress: 0,
        isFavorite: false,
      });
    }
  }

  return library.sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  );
}

export function saveLibrary(library: LibraryBook[]) {
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
}

export function getLibrary(): LibraryBook[] {
  const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function incrementDownload(bookId: string): LibraryBook[] {
  const library = getLibrary();
  const updated = library.map((item) =>
    item.book.id === bookId
      ? {
          ...item,
          downloadCount: item.downloadCount + 1,
          lastDownloadedAt: new Date().toISOString(),
        }
      : item
  );
  saveLibrary(updated);
  return updated;
}

export function toggleFavorite(bookId: string): LibraryBook[] {
  const library = getLibrary();
  const updated = library.map((item) =>
    item.book.id === bookId ? { ...item, isFavorite: !item.isFavorite } : item
  );
  saveLibrary(updated);
  return updated;
}

export function updateProgress(bookId: string, progress: number): LibraryBook[] {
  const library = getLibrary();
  const updated = library.map((item) =>
    item.book.id === bookId
      ? { ...item, progress: Math.min(100, Math.max(0, progress)) }
      : item
  );
  saveLibrary(updated);
  return updated;
}