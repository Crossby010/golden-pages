import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Calendar,
  Loader2,
  ChevronRight,
  X,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { orderService } from '@/services/order-service';
import { useAuth } from '@/hooks/use-auth';
import { formatDate } from '@/lib/order-utils';
import type { Order } from '@/types/order';

export function OrderHistory() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAuthenticated) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const data = await orderService.listMine();
        if (!cancelled) setOrders(data);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-brass-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading your orders...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cream flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-brass-500" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-navy-700 mb-3">
          Sign in to view your orders
        </h1>
        <p className="text-gray-500 mb-6">
          Log in to access your order history.
        </p>
        <Link to="/login">
          <Button className="bg-brass-500 hover:bg-brass-600 text-white">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cream flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-brass-500" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-navy-700 mb-3">
          No Orders Yet
        </h1>
        <p className="text-gray-500 mb-6">
          You haven't placed any orders yet. Start shopping to see your history here.
        </p>
        <Link to="/books">
          <Button className="bg-brass-500 hover:bg-brass-600 text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Books
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-brass-500" />
          Order History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => setActiveOrder(order)}
            className="w-full flex items-center gap-4 p-4 bg-cream rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-navy-300 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-brass-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-serif font-bold text-navy-700 text-sm">
                  #{order.orderNumber}
                </span>
                <Badge
                  variant="secondary"
                  className={
                    order.status === 'completed'
                      ? 'bg-green-100 text-green-700 text-xs'
                      : order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 text-xs'
                      : 'bg-red-100 text-red-700 text-xs'
                  }
                >
                  {order.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(order.createdAt)}
                </span>
                <span>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-brass-500">
                ₱{order.total.toFixed(2)}
              </p>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-navy-700 transition-colors ml-auto mt-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Order detail modal */}
      {activeOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setActiveOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between p-4 sm:p-5 z-10">
              <div>
                <h2 className="text-lg font-serif font-bold text-navy-700">
                  Order #{activeOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-500">
                  {formatDate(activeOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-cream rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Payment Method
                  </p>
                  <p className="text-sm font-medium text-navy-700 capitalize">
                    {activeOrder.paymentMethod === 'qrph'
                      ? 'QR Ph'
                      : activeOrder.paymentMethod}
                  </p>
                </div>
                <div className="p-3 bg-cream rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Status
                  </p>
                  <p className="text-sm font-medium text-green-600 capitalize">
                    {activeOrder.status}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-semibold text-navy-700 mb-3">
                  Items ({activeOrder.items.length})
                </h3>
                <div className="space-y-3">
                  {activeOrder.items.map((item) => (
                    <div key={item.bookId} className="flex items-center gap-3">
                      <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        {item.book.coverUrl ? (
                          <img
                            src={item.book.coverUrl}
                            alt={item.book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-brass-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-700 truncate">
                          {item.book.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          By {item.book.author} • Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-brass-500 flex-shrink-0">
                        ₱{(item.priceAtTime * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-navy-700">Total</span>
                  <span className="text-2xl font-bold text-brass-500">
                    ₱{activeOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to="/my-library" className="block">
                <Button className="w-full bg-brass-500 hover:bg-brass-600 text-white h-11">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Go to My Library
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
