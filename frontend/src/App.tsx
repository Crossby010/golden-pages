import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth-provider';
import { CartProvider } from '@/contexts/cart-provider';
import { ToastProvider } from '@/components/ui/toast';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Homepage } from '@/components/home/homepage';
import { Login } from '@/components/auth/login';
import { Register } from '@/components/auth/register';
import { Cart } from '@/components/cart/cart';
import { Checkout } from '@/components/checkout/checkout';
import { OrderSuccess } from '@/components/checkout/order-success';
import { MyLibrary } from '@/components/library/my-library';
import { Reader } from '@/components/reader/reader';

// Books
import { BooksPage } from '@/components/books/books-page';
import { BookDetail } from '@/components/books/book-detail';
import { AuthorsPage } from '@/components/authors/authors-page';
import { PlaceholderPage } from '@/components/common/placeholder-page';

// Profile + Orders
import { ProfilePage } from '@/components/profile/profile-page';
import { OrderHistory } from '@/components/orders/order-history';

// Admin
import { AdminLayout } from '@/components/admin/admin-layout';
import { AdminDashboard } from '@/components/admin/dashboard';
import { BooksManagement } from '@/components/admin/books-management';
import { HomepageSettingsPage } from '@/components/admin/homepage-settings';
import { UsersManagement } from '@/components/admin/users-management';
import { AdminSettings } from '@/components/admin/settings';
import { AdminGuard } from '@/components/admin/admin-guard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {/* Reader — full screen, no navbar/footer */}
              <Route path="/read/:bookId" element={<Reader />} />

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="books" element={<BooksManagement />} />
                <Route path="homepage" element={<HomepageSettingsPage />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Public site */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-cream flex flex-col">
                    <Navbar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Homepage />} />
                        <Route path="/books" element={<BooksPage />} />
                        <Route path="/books/:bookId" element={<BookDetail />} />
                        <Route path="/authors" element={<AuthorsPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route
                          path="/order-success/:orderNumber"
                          element={<OrderSuccess />}
                        />
                        <Route path="/my-library" element={<MyLibrary />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/orders" element={<OrderHistory />} />

                        {/* Placeholder pages */}
                        <Route
                          path="/about"
                          element={
                            <PlaceholderPage
                              title="About Us"
                              description="Learn more about Golden Pages Book Store and our mission."
                            />
                          }
                        />
                        <Route
                          path="/terms"
                          element={
                            <PlaceholderPage
                              title="Terms of Service"
                              description="Our terms and conditions are being finalized."
                            />
                          }
                        />
                        <Route
                          path="/privacy"
                          element={
                            <PlaceholderPage
                              title="Privacy Policy"
                              description="How we protect and handle your data."
                            />
                          }
                        />
                        <Route
                          path="/cookies"
                          element={
                            <PlaceholderPage
                              title="Cookie Policy"
                              description="How we use cookies on our site."
                            />
                          }
                        />
                        <Route
                          path="/faq"
                          element={
                            <PlaceholderPage
                              title="Frequently Asked Questions"
                              description="Answers to common questions about our bookstore."
                            />
                          }
                        />
                        <Route
                          path="/forgot-password"
                          element={
                            <PlaceholderPage
                              title="Reset Password"
                              description="Password reset functionality is coming soon. Contact support if you need help."
                            />
                          }
                        />
                        <Route
                          path="/categories"
                          element={
                            <PlaceholderPage
                              title="Categories"
                              description="Browse all book categories — coming soon."
                            />
                          }
                        />
                        <Route
                          path="/categories/:slug"
                          element={
                            <PlaceholderPage
                              title="Category"
                              description="Category listing is coming soon."
                            />
                          }
                        />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                }
              />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
