import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

export function Cart() {
  const { items, removeFromCart, updateQuantity, getSubtotal, getTotalItems, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cream flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-brass-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700 mb-3">
            Your Cart is Empty
          </h1>
          <p className="text-gray-500 mb-6">
            Looks like you haven't added any books yet. Start exploring our collection!
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700">
            Shopping Cart
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.book.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col sm:flex-row gap-4 p-4 sm:p-5 ${
                    index !== items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden bg-gradient-to-br from-brass-100 to-brass-200">
                    {item.book.coverUrl ? (
                      <img
                        src={item.book.coverUrl}
                        alt={item.book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-brass-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="font-serif font-bold text-navy-700 text-base truncate">
                          {item.book.title}
                        </h3>
                        <p className="text-sm text-gray-500">By {item.book.author}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.book.category}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.book.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        aria-label="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.book.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-navy-700 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.book.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-navy-700 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          ₱{item.book.price.toFixed(2)} each
                        </p>
                        <p className="text-lg font-bold text-brass-500">
                          ₱{(item.book.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4">
            <Link
              to="/books"
              className="text-sm text-gray-500 hover:text-navy-700 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue shopping
            </Link>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-cream rounded-2xl p-5 sm:p-6 sticky top-24">
            <h2 className="text-lg font-serif font-bold text-navy-700 mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₱{getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600 font-medium">Free (Digital)</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-b border-gray-200">
              <span className="font-semibold text-navy-700">Total</span>
              <span className="text-2xl font-bold text-brass-500">
                ₱{getSubtotal().toFixed(2)}
              </span>
            </div>

            <div className="py-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                Secure checkout
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Zap className="w-4 h-4 text-brass-500 flex-shrink-0" />
                Instant digital delivery
              </div>
            </div>

            <Link to="/checkout">
              <Button className="w-full bg-brass-500 hover:bg-brass-600 text-white h-11 flex items-center justify-center gap-2">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
