import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  Package,
  Mail,
  ArrowRight,
  BookOpen,
  Download,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/order-utils';
import { orderService } from '@/services/order-service';
import type { Order } from '@/types/order';

export function OrderSuccess() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orderNumber) {
        if (!cancelled) {
          setError('Order number missing');
          setLoading(false);
        }
        return;
      }

      try {
        const data = await orderService.getByNumber(orderNumber);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-brass-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-serif font-bold text-navy-700 mb-4">
          Order not found
        </h1>
        <p className="text-gray-500 mb-6">
          {error || "We couldn't find an order with that number."}
        </p>
        <Link to="/books">
          <Button className="bg-brass-500 hover:bg-brass-600 text-white">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="flex justify-center mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', duration: 0.5 }}
            className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center"
          >
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-gray-500 mb-1">
          Thank you for your purchase, {order.shippingInfo.fullName}!
        </p>
        <p className="text-sm text-gray-400">
          Order #{order.orderNumber}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-cream rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6"
      >
        <div className="bg-cream p-4 sm:p-5 border-b border-brass-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brass-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-brass-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-navy-700">
                Confirmation email sent
              </p>
              <p className="text-xs text-gray-500">
                We've sent the details to {order.shippingInfo.email}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Order Date
              </p>
              <p className="text-sm font-medium text-navy-700">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Payment Method
              </p>
              <p className="text-sm font-medium text-navy-700 capitalize">
                {order.paymentMethod === 'qrph' ? 'QR Ph' : order.paymentMethod}
              </p>
            </div>
          </div>

          <div className="py-4">
            <h3 className="text-sm font-semibold text-navy-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-brass-500" />
              Your Books ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.bookId} className="flex items-center gap-3">
                  <div className="w-12 h-16 flex-shrink-0 bg-gradient-to-br from-brass-100 to-brass-200 rounded flex items-center justify-center text-xl">
                    {item.book.coverEmoji}
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
              <span className="font-semibold text-navy-700">Total Paid</span>
              <span className="text-2xl font-bold text-brass-500">
                ₱{order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-cream rounded-2xl p-5 sm:p-6 mb-6"
      >
        <h3 className="text-sm font-semibold text-navy-700 mb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-brass-500" />
          What's Next?
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            Your books are now available in <strong>My Library</strong>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            Download or read online anytime, anywhere
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            Access your books from any device
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Link to="/my-library" className="flex-1">
          <Button className="w-full bg-brass-500 hover:bg-brass-600 text-white h-11 flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" />
            Go to My Library
          </Button>
        </Link>
        <Link to="/books" className="flex-1">
          <Button
            variant="outline"
            className="w-full h-11 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
