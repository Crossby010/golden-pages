import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowRight,
  Plus,
  Eye,
  Clock,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { orderService } from '@/services/order-service';
import { bookService } from '@/services/book-service';
import { authService } from '@/services/auth-service';
import { getRecentActivity } from '@/lib/admin-utils';
import type { RecentActivity } from '@/types/admin';
import { cn } from '@/lib/utils';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    onlineUsers: 0,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    usersGrowth: 15.2,
    booksGrowth: 5.0,
  });
  const [salesData, setSalesData] = useState<
    { date: string; revenue: number; orders: number }[]
  >([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [bookStats, orderStats, userStats] = await Promise.all([
          bookService.getStats(),
          orderService.getStats(),
          authService.getStats(),
        ]);

        if (cancelled) return;

        setStats({
          totalBooks: bookStats.total,
          totalOrders: orderStats.totalOrders,
          totalUsers: userStats.totalUsers,
          totalRevenue: orderStats.totalRevenue,
          onlineUsers: userStats.onlineUsers,
          revenueGrowth: 12.5,
          ordersGrowth: 8.3,
          usersGrowth: 15.2,
          booksGrowth: 5.0,
        });

        const days: { date: string; revenue: number; orders: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const found = orderStats.revenueLast7Days.find(
            (x) => x.date === dateStr
          );
          days.push({
            date: d.toLocaleDateString('en-PH', { weekday: 'short' }),
            revenue: found?.revenue ?? 0,
            orders: found?.orders ?? 0,
          });
        }
        setSalesData(days);
        setActivities(getRecentActivity());
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    { name: 'Total Revenue', value: `₱${stats.totalRevenue.toFixed(2)}`, change: stats.revenueGrowth, icon: DollarSign, color: 'gold' },
    { name: 'Total Orders', value: stats.totalOrders.toString(), change: stats.ordersGrowth, icon: ShoppingCart, color: 'blue' },
    { name: 'Total Books', value: stats.totalBooks.toString(), change: stats.booksGrowth, icon: BookOpen, color: 'green' },
    { name: 'Total Users', value: stats.totalUsers.toString(), change: stats.usersGrowth, icon: Users, color: 'purple' },
  ];

  const maxRevenue = Math.max(...salesData.map((d) => d.revenue), 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-700">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back! Here's what's happening with your store.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/books">
            <Button variant="outline" size="sm" className="border-gray-200 h-10">
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
          </Link>
          <Link to="/admin/homepage">
            <Button className="bg-brass-500 hover:bg-brass-600 text-white h-10">
              <Eye className="w-4 h-4 mr-2" />
              Homepage Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
        <Circle className="w-3 h-3 text-green-500 fill-green-500 animate-pulse" />
        <p className="text-sm text-green-800">
          <strong>{stats.onlineUsers} {stats.onlineUsers === 1 ? 'user' : 'users'}</strong>{' '}
          {stats.onlineUsers === 1 ? 'is' : 'are'} currently browsing your store
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    stat.color === 'gold' && 'bg-brass-100 text-brass-600',
                    stat.color === 'blue' && 'bg-blue-100 text-blue-600',
                    stat.color === 'green' && 'bg-green-100 text-green-600',
                    stat.color === 'purple' && 'bg-purple-100 text-purple-600'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-semibold',
                    isPositive ? 'text-green-600' : 'text-red-500'
                  )}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.name}</p>
              <p className="text-2xl font-bold text-navy-700 mt-1">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-navy-700">Sales Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 days</p>
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-48">
              {salesData.map((day, i) => {
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex-1 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="w-full bg-gradient-to-t from-brass-500 to-brass-400 rounded-t-md group-hover:from-brass-600 group-hover:to-brass-500 transition-colors relative"
                      >
                        {day.revenue > 0 && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-700 text-cream text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                            ₱{day.revenue.toFixed(0)} ({day.orders} orders)
                          </div>
                        )}
                      </motion.div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{day.date}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg font-bold text-navy-700">
                ₱{salesData.reduce((s, d) => s + d.revenue, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-lg font-bold text-navy-700">
                {salesData.reduce((s, d) => s + d.orders, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg. Order</p>
              <p className="text-lg font-bold text-navy-700">
                ₱
                {salesData.reduce((s, d) => s + d.orders, 0) > 0
                  ? (salesData.reduce((s, d) => s + d.revenue, 0) / salesData.reduce((s, d) => s + d.orders, 0)).toFixed(2)
                  : '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-bold text-navy-700">Recent Activity</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    activity.type === 'order' && 'bg-blue-100 text-blue-600',
                    activity.type === 'book' && 'bg-brass-100 text-brass-600'
                  )}
                >
                  {activity.type === 'order' && <ShoppingCart className="w-4 h-4" />}
                  {activity.type === 'book' && <BookOpen className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-700 line-clamp-2">{activity.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(activity.timestamp).toLocaleString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-serif font-bold text-navy-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/admin/books" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-navy-300 hover:bg-navy-50 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-brass-100 text-brass-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-navy-700 text-sm">Manage Books</p>
              <p className="text-xs text-gray-500">Add, edit, delete</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-navy-700 transition-colors" />
          </Link>

          <Link to="/admin/homepage" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-navy-300 hover:bg-navy-50 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-navy-700 text-sm">Homepage Settings</p>
              <p className="text-xs text-gray-500">Featured, Popular, New</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-navy-700 transition-colors" />
          </Link>

          <Link to="/" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-navy-300 hover:bg-navy-50 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-navy-700 text-sm">Preview Homepage</p>
              <p className="text-xs text-gray-500">See live changes</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-navy-700 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
