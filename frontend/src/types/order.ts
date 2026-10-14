import type { Book } from './book';

export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
}

export type PaymentMethod = 'gcash' | 'maya' | 'qrph' | 'card';

export interface OrderItem {
  bookId: string;
  book: Book;
  quantity: number;
  priceAtTime: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: PaymentMethod;
  shippingInfo: ShippingInfo;
  createdAt: string;
  completedAt: string | null;
}