import { api } from '@/lib/api';
import type { Order } from '@/types/order';

export interface CreateOrderInput {
  items: { bookId: string; quantity: number }[];
  shippingInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    zipCode: string;
  };
  paymentMethod: 'gcash' | 'maya' | 'qrph' | 'card';
}

export interface OrderStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueLast7Days: { date: string; revenue: number; orders: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
}

export const orderService = {
  async create(input: CreateOrderInput): Promise<Order> {
    const { data } = await api.post<{ message: string; order: Order }>(
      '/orders',
      input
    );
    return data.order;
  },

  async listMine(): Promise<Order[]> {
    const { data } = await api.get<{ orders: Order[] }>('/orders/mine');
    return data.orders;
  },

  async getById(id: string): Promise<Order> {
    const { data } = await api.get<{ order: Order }>(`/orders/${id}`);
    return data.order;
  },

  async getByNumber(orderNumber: string): Promise<Order> {
    const { data } = await api.get<{ order: Order }>(
      `/orders/number/${orderNumber}`
    );
    return data.order;
  },

  // ADMIN
  async listAll(): Promise<Order[]> {
    const { data } = await api.get<{ orders: Order[] }>('/orders');
    return data.orders;
  },

  async getStats(): Promise<OrderStats> {
    const { data } = await api.get<OrderStats>('/orders/admin/stats');
    return data;
  },
};