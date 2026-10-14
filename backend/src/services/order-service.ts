import { sql } from '../config/database.js';
import { redis } from '../config/redis.js';
import { AppError } from '../middleware/error-handler.js';

// ============================================
// TYPES
// ============================================

export interface OrderItemInput {
  bookId: string;
  quantity: number;
}

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

export interface CreateOrderInput {
  items: OrderItemInput[];
  shippingInfo: ShippingInfo;
  paymentMethod: PaymentMethod;
}

export interface DbOrder {
  id: string;
  user_id: string | null;
  order_number: string;
  subtotal: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method: string;
  shipping_info: ShippingInfo;
  created_at: string;
  completed_at: string | null;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  book_id: string | null;
  book_snapshot: {
    id: string;
    title: string;
    author: string;
    coverEmoji: string;
    coverUrl: string;
    price: number;
    pdfUrl: string | null;
  };
  quantity: number;
  price_at_time: number;
}

export interface SafeOrder {
  id: string;
  orderNumber: string;
  userId: string | null;
  items: {
    bookId: string | null;
    book: DbOrderItem['book_snapshot'];
    quantity: number;
    priceAtTime: number;
  }[];
  subtotal: number;
  total: number;
  status: string;
  paymentMethod: string;
  shippingInfo: ShippingInfo;
  createdAt: string;
  completedAt: string | null;
}

// ============================================
// HELPERS
// ============================================

function generateOrderNumber(): string {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `GP-${ts}-${rand}`;
}

function toSafeOrder(order: DbOrder, items: DbOrderItem[]): SafeOrder {
  return {
    id: order.id,
    orderNumber: order.order_number,
    userId: order.user_id,
    items: items.map((i) => ({
      bookId: i.book_id,
      book: i.book_snapshot,
      quantity: i.quantity,
      priceAtTime: Number(i.price_at_time),
    })),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    status: order.status,
    paymentMethod: order.payment_method,
    shippingInfo: order.shipping_info,
    createdAt: order.created_at,
    completedAt: order.completed_at,
  };
}

async function fetchOrderItems(orderIds: string[]): Promise<DbOrderItem[]> {
  if (orderIds.length === 0) return [];
  const all: DbOrderItem[] = [];
  for (const orderId of orderIds) {
    const rows = (await sql`
      SELECT * FROM order_items WHERE order_id = ${orderId}
    `) as DbOrderItem[];
    all.push(...rows);
  }
  return all;
}

// ============================================
// CREATE ORDER
// ============================================

export async function createOrder(
  userId: string | null,
  input: CreateOrderInput
): Promise<SafeOrder> {
  if (!input.items || input.items.length === 0) {
    throw new AppError('Order must have at least one item', 400);
  }

  const books: {
    id: string;
    title: string;
    author: string;
    price: number;
    cover_url: string;
    pdf_url: string | null;
  }[] = [];

  for (const item of input.items) {
    const rows = (await sql`
      SELECT id, title, author, price, cover_url, pdf_url
      FROM books
      WHERE id = ${item.bookId}
      LIMIT 1
    `) as typeof books;
    if (rows[0]) books.push(rows[0]);
  }

  const bookMap = new Map(books.map((b) => [b.id, b]));

  for (const item of input.items) {
    if (!bookMap.has(item.bookId)) {
      throw new AppError(`Book not found: ${item.bookId}`, 404);
    }
    if (item.quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }
  }

  let subtotal = 0;
  const enrichedItems = input.items.map((item) => {
    const book = bookMap.get(item.bookId)!;
    const price = Number(book.price);
    subtotal += price * item.quantity;
    return {
      book,
      quantity: item.quantity,
      priceAtTime: price,
    };
  });

  const total = subtotal;
  const orderNumber = generateOrderNumber();

  const orderRows = (await sql`
    INSERT INTO orders (
      user_id, order_number, subtotal, total, status,
      payment_method, shipping_info, completed_at
    ) VALUES (
      ${userId},
      ${orderNumber},
      ${subtotal},
      ${total},
      'completed',
      ${input.paymentMethod},
      ${JSON.stringify(input.shippingInfo)}::jsonb,
      NOW()
    )
    RETURNING *
  `) as DbOrder[];

  const order = orderRows[0];

  const insertedItems: DbOrderItem[] = [];
  for (const item of enrichedItems) {
    const snapshot = {
      id: item.book.id,
      title: item.book.title,
      author: item.book.author,
      coverEmoji: '',
      coverUrl: item.book.cover_url,
      price: Number(item.book.price),
      pdfUrl: item.book.pdf_url,
    };

    const itemRows = (await sql`
      INSERT INTO order_items (
        order_id, book_id, book_snapshot, quantity, price_at_time
      ) VALUES (
        ${order.id},
        ${item.book.id},
        ${JSON.stringify(snapshot)}::jsonb,
        ${item.quantity},
        ${item.priceAtTime}
      )
      RETURNING *
    `) as DbOrderItem[];

    insertedItems.push(itemRows[0]);
  }

  await redis.del('orders:stats');

  return toSafeOrder(order, insertedItems);
}

// ============================================
// LIST USER ORDERS
// ============================================

export async function listUserOrders(userId: string): Promise<SafeOrder[]> {
  const orders = (await sql`
    SELECT * FROM orders
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as DbOrder[];

  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const items = await fetchOrderItems(orderIds);

  const itemsByOrder = new Map<string, DbOrderItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((o) => toSafeOrder(o, itemsByOrder.get(o.id) || []));
}

// ============================================
// GET ONE ORDER
// ============================================

export async function getOrderById(
  orderId: string,
  userId: string | null
): Promise<SafeOrder> {
  const rows = (await sql`
    SELECT * FROM orders WHERE id = ${orderId} LIMIT 1
  `) as DbOrder[];

  if (rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = rows[0];

  if (userId && order.user_id && order.user_id !== userId) {
    throw new AppError('You do not have access to this order', 403);
  }

  const items = (await sql`
    SELECT * FROM order_items WHERE order_id = ${order.id}
  `) as DbOrderItem[];

  return toSafeOrder(order, items);
}

// ============================================
// GET BY NUMBER
// ============================================

export async function getOrderByNumber(
  orderNumber: string
): Promise<SafeOrder> {
  const rows = (await sql`
    SELECT * FROM orders WHERE order_number = ${orderNumber} LIMIT 1
  `) as DbOrder[];

  if (rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = rows[0];
  const items = (await sql`
    SELECT * FROM order_items WHERE order_id = ${order.id}
  `) as DbOrderItem[];

  return toSafeOrder(order, items);
}

// ============================================
// ADMIN — LIST ALL
// ============================================

export async function listAllOrders(limit = 100): Promise<SafeOrder[]> {
  const orders = (await sql`
    SELECT * FROM orders
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as DbOrder[];

  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const items = await fetchOrderItems(orderIds);

  const itemsByOrder = new Map<string, DbOrderItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((o) => toSafeOrder(o, itemsByOrder.get(o.id) || []));
}

// ============================================
// STATS
// ============================================

export interface OrderStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueLast7Days: { date: string; revenue: number; orders: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
}

export async function getOrderStats(): Promise<OrderStats> {
  const cached = await redis.get('orders:stats');
  if (cached) return cached as OrderStats;

  const overall = (await sql`
    SELECT
      COALESCE(SUM(total), 0)::float AS total_revenue,
      COUNT(*)::int AS total_orders
    FROM orders
    WHERE status = 'completed'
  `) as { total_revenue: number; total_orders: number }[];

  const totalRevenue = overall[0].total_revenue;
  const totalOrders = overall[0].total_orders;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const byDay = (await sql`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
      COALESCE(SUM(total), 0)::float AS revenue,
      COUNT(*)::int AS orders
    FROM orders
    WHERE status = 'completed'
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY date
    ORDER BY date ASC
  `) as { date: string; revenue: number; orders: number }[];

  const stats: OrderStats = {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    revenueLast7Days: byDay,
    revenueByDay: byDay,
  };

  await redis.set('orders:stats', JSON.stringify(stats), { ex: 60 });

  return stats;
}

// ============================================
// CHECK OWNERSHIP (for Read Online)
// ============================================

export async function userOwnsBook(
  userId: string,
  bookId: string
): Promise<boolean> {
  const rows = (await sql`
    SELECT oi.id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = ${userId}
      AND oi.book_id = ${bookId}
      AND o.status = 'completed'
    LIMIT 1
  `) as { id: string }[];

  return rows.length > 0;
}