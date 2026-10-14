import type { Book } from './book';

export interface AdminStats {
  totalBooks: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  onlineUsers: number;
  revenueGrowth: number;
  ordersGrowth: number;
  usersGrowth: number;
  booksGrowth: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'book';
  message: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'order' | 'system' | 'book';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface HomepageSettings {
  heroSlides: HeroSlide[];
  showCategories: boolean;
  showFeaturedBooks: boolean;
  showPopularBooks: boolean;
  showNewArrivals: boolean;
  showFeaturedAuthors: boolean;
  featuredBookIds: string[];
  popularBookIds: string[];
  newArrivalBookIds: string[];
  spotlightTitle: string;
  spotlightSubtitle: string;
  spotlightBookId: string | null;
}

export interface HeroSlide {
  id: number;
  icon: string;
  title: string;
  description: string;
  cta: string;
  ctaLink: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeDescription: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  currency: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
}

export type { Book };