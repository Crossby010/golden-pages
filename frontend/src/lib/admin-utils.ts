import type { Order } from '@/types/order';
import type {
  AdminStats,
  SalesDataPoint,
  RecentActivity,
  HomepageSettings,
  StoreSettings,
  Notification,
} from '@/types/admin';

const ORDERS_KEY = 'golden-pages-orders';
const HOMEPAGE_KEY = 'golden-pages-homepage-settings';
const STORE_KEY = 'golden-pages-store-settings';
const NOTIFICATIONS_KEY = 'golden-pages-notifications';

// ============================================
// ORDERS
// ============================================

export function getAllOrders(): Order[] {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}

// ============================================
// STATS
// ============================================

export function getAdminStats(): AdminStats {
  const orders = getAllOrders();
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const uniqueEmails = new Set(orders.map((o) => o.shippingInfo.email));
  const totalUsers = Math.max(uniqueEmails.size, 12);
  const onlineUsers = Math.floor(Math.random() * 8) + 3;

  return {
    totalBooks: 0,
    totalOrders,
    totalUsers,
    totalRevenue,
    onlineUsers,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    usersGrowth: 15.2,
    booksGrowth: 5.0,
  };
}

export function getSalesData(days: number = 7): SalesDataPoint[] {
  const orders = getAllOrders();
  const data: SalesDataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter((o) => o.createdAt.split('T')[0] === dateStr);

    data.push({
      date: date.toLocaleDateString('en-PH', { weekday: 'short' }),
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      orders: dayOrders.length,
    });
  }

  return data;
}

export function getRecentActivity(): RecentActivity[] {
  const orders = getAllOrders();
  const activities: RecentActivity[] = [];

  orders.slice(0, 5).forEach((order) => {
    activities.push({
      id: order.id,
      type: 'order',
      message: `New order ${order.orderNumber} — ₱${order.total.toFixed(2)}`,
      timestamp: order.createdAt,
    });
  });

  if (activities.length === 0) {
    activities.push({
      id: 'sample-1',
      type: 'book',
      message: 'Welcome to Golden Pages Admin',
      timestamp: new Date().toISOString(),
    });
  }

  return activities;
}

// ============================================
// NOTIFICATIONS
// ============================================

export function getNotifications(): Notification[] {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveNotifications(notifications: Notification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export function markNotificationRead(id: string): Notification[] {
  const notifications = getNotifications();
  const updated = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
  return updated;
}

export function markAllNotificationsRead(): Notification[] {
  const notifications = getNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
  return updated;
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function generateNotificationsFromOrders(): Notification[] {
  const orders = getAllOrders();
  const existing = getNotifications();
  const existingIds = new Set(existing.map((n) => n.id));
  const newNotifications: Notification[] = [];

  orders.forEach((order) => {
    if (!existingIds.has(`order-${order.id}`)) {
      newNotifications.push({
        id: `order-${order.id}`,
        type: 'order',
        title: 'New Order Received',
        message: `Order ${order.orderNumber} from ${order.shippingInfo.fullName} — ₱${order.total.toFixed(2)}`,
        timestamp: order.createdAt,
        read: false,
      });
    }
  });

  if (newNotifications.length > 0) {
    const all = [...newNotifications, ...existing];
    saveNotifications(all);
    return all;
  }

  return existing;
}

export function generateNotificationsFromUsers(
  users: { id: string; name: string; email: string; createdAt: string }[]
): Notification[] {
  const existing = getNotifications();
  const existingIds = new Set(existing.map((n) => n.id));
  const newNotifications: Notification[] = [];

  users.forEach((user) => {
    const id = `user-${user.id}`;
    if (!existingIds.has(id)) {
      newNotifications.push({
        id,
        type: 'system',
        title: 'New User Registered',
        message: `${user.name} (${user.email}) just signed up`,
        timestamp: user.createdAt,
        read: false,
      });
    }
  });

  if (newNotifications.length > 0) {
    const all = [...newNotifications, ...existing];
    saveNotifications(all);
    return all;
  }

  return existing;
}

// ============================================
// HOMEPAGE SETTINGS
// ============================================

const defaultHomepageSettings: HomepageSettings = {
  heroSlides: [
    { id: 1, icon: '📚', title: 'Your Next Adventure Awaits', description: 'Discover thousands of digital books at your fingertips. Instant access. Anywhere, anytime.', cta: 'Browse Books', ctaLink: '/books' },
    { id: 2, icon: '🇵🇭', title: 'Filipino Literature Spotlight', description: 'Discover the best of Philippine literature from our local authors.', cta: 'Explore Now', ctaLink: '/categories/filipino' },
    { id: 3, icon: '✨', title: 'New Arrivals', description: 'Fresh books added this week. Be the first to read the latest releases.', cta: 'See New Books', ctaLink: '/books?sort=newest' },
    { id: 4, icon: '🎓', title: 'Student Special', description: 'Get 20% off on academic titles. Show your student ID and save.', cta: 'Get Discount', ctaLink: '/promotions/student' },
  ],
  showCategories: true,
  showFeaturedBooks: true,
  showPopularBooks: true,
  showNewArrivals: true,
  showFeaturedAuthors: true,
  featuredBookIds: [],
  popularBookIds: [],
  newArrivalBookIds: [],
  spotlightTitle: 'Discover Filipino Literature',
  spotlightSubtitle: 'Celebrating our literary heritage',
  spotlightBookId: null,
};

export function getHomepageSettings(): HomepageSettings {
  const stored = localStorage.getItem(HOMEPAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultHomepageSettings;
    }
  }
  return defaultHomepageSettings;
}

export function saveHomepageSettings(settings: HomepageSettings): void {
  localStorage.setItem(HOMEPAGE_KEY, JSON.stringify(settings));
}

export function resetHomepageSettings(): HomepageSettings {
  localStorage.setItem(HOMEPAGE_KEY, JSON.stringify(defaultHomepageSettings));
  return defaultHomepageSettings;
}

// ============================================
// STORE SETTINGS
// ============================================

export const defaultStoreSettings: StoreSettings = {
  storeName: 'Golden Pages',
  storeTagline: 'Your digital bookstore',
  storeDescription: 'Your digital bookstore. Discover thousands of books at your fingertips. Instant access, anywhere, anytime.',
  email: 'hello@goldenpages.ph',
  phone: '+63 2 1234 5678',
  address: 'Manila, Philippines',
  city: 'Manila',
  currency: 'PHP',
  socialLinks: {
    facebook: 'https://facebook.com/goldenpagesph',
    twitter: 'https://x.com/goldenpagesph',
    instagram: 'https://instagram.com/goldenpagesph',
    tiktok: 'https://tiktok.com/@goldenpagesph',
    youtube: 'https://youtube.com/@goldenpagesph',
  },
};

export function getStoreSettings(): StoreSettings {
  const stored = localStorage.getItem(STORE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultStoreSettings;
    }
  }
  return defaultStoreSettings;
}

export function saveStoreSettings(settings: StoreSettings): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(settings));
}

export function resetStoreSettings(): StoreSettings {
  localStorage.setItem(STORE_KEY, JSON.stringify(defaultStoreSettings));
  return defaultStoreSettings;
}