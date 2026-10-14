import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { orderService } from '@/services/order-service';
import { getErrorMessage } from '@/lib/api';
import {
  GCashLogo,
  MayaLogo,
  QRPhLogo,
  CardLogos,
} from './payment-logos';
import type { PaymentMethod } from '@/types/order';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  Logo: React.ComponentType<{ className?: string }>;
  description: string;
  tag?: string;
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const total = subtotal;

  // If not authenticated, prompt login
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-serif font-bold text-navy-700 mb-4">
          Please sign in to checkout
        </h1>
        <p className="text-gray-500 mb-6">
          You need an account to complete your purchase.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/login">
            <Button className="bg-brass-500 hover:bg-brass-600 text-white">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline">Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-serif font-bold text-navy-700 mb-4">
          Your cart is empty
        </h1>
        <p className="text-gray-500 mb-6">
          Add some books before checking out.
        </p>
        <Link to="/books">
          <Button className="bg-brass-500 hover:bg-brass-600 text-white">
            Browse Books
          </Button>
        </Link>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.province.trim()) newErrors.province = 'Province is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setIsProcessing(true);
    try {
      const order = await orderService.create({
        items: items.map((item) => ({
          bookId: item.book.id,
          quantity: item.quantity,
        })),
        shippingInfo: formData,
        paymentMethod,
      });

      // Clear cart
      clearCart();

      // Navigate to success page with order number
      navigate(`/order-success/${order.orderNumber}`);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentOptions: PaymentOption[] = [
    {
      id: 'gcash',
      name: 'GCash',
      Logo: GCashLogo,
      description: 'Pay using your GCash wallet',
      tag: 'Popular',
    },
    {
      id: 'maya',
      name: 'Maya',
      Logo: MayaLogo,
      description: 'Pay using your Maya wallet',
    },
    {
      id: 'qrph',
      name: 'QR Ph',
      Logo: QRPhLogo,
      description: 'Scan QR code with any PH bank app',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      Logo: CardLogos,
      description: 'Visa, Mastercard',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/cart"
        className="text-sm text-gray-500 hover:text-navy-700 transition-colors inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </Link>

      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-700 mb-2">
        Checkout
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Complete your order to get instant access to your books
      </p>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="text-lg font-serif font-bold text-navy-700 mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Juan Dela Cruz"
                    className={errors.fullName ? 'border-red-400' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-500">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className={errors.email ? 'border-red-400' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+63 912 345 6789"
                    className={errors.phone ? 'border-red-400' : ''}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="text-lg font-serif font-bold text-navy-700 mb-4">
                Billing Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Rizal Street, Barangay San Lorenzo"
                    className={errors.address ? 'border-red-400' : ''}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500">{errors.address}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Makati"
                    className={errors.city ? 'border-red-400' : ''}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    placeholder="Metro Manila"
                    className={errors.province ? 'border-red-400' : ''}
                  />
                  {errors.province && (
                    <p className="text-xs text-red-500">{errors.province}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="1200"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="text-lg font-serif font-bold text-navy-700 mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                {paymentOptions.map((option) => {
                  const Logo = option.Logo;
                  const isSelected = paymentMethod === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPaymentMethod(option.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-navy-700 bg-brass-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-16 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-gray-100 p-1.5">
                        <Logo className="w-full h-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-navy-700">
                            {option.name}
                          </p>
                          {option.tag && (
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                option.tag === 'Popular'
                                  ? 'bg-brass-100 text-brass-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {option.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'border-navy-700 bg-brass-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-cream rounded-2xl p-5 sm:p-6 sticky top-24">
              <h2 className="text-lg font-serif font-bold text-navy-700 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 pb-4 border-b border-gray-200">
                {items.map((item) => (
                  <div key={item.book.id} className="flex gap-3">
                    <div className="w-12 h-16 flex-shrink-0 bg-gradient-to-br from-brass-100 to-brass-200 rounded flex items-center justify-center text-xl">
                      {item.book.coverEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-700 truncate">
                        {item.book.title}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-brass-500 flex-shrink-0">
                      ₱{(item.book.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 py-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">Free (Digital)</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-4">
                <span className="font-semibold text-navy-700">Total</span>
                <span className="text-2xl font-bold text-brass-500">
                  ₱{total.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2 pb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  Secure checkout
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Zap className="w-4 h-4 text-brass-500 flex-shrink-0" />
                  Instant digital delivery
                </div>
              </div>

              {apiError && (
                <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600">{apiError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-brass-500 hover:bg-brass-600 text-white h-12 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Place Order • ₱{total.toFixed(2)}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
