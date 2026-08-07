import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import { StoreLayout } from './layouts/StoreLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Storefront Pages
import { HomePage } from './pages/store/HomePage';
import { CatalogPage } from './pages/store/CatalogPage';
import { ProductDetailPage } from './pages/store/ProductDetailPage';
import { CartPage } from './pages/store/CartPage';
import { CheckoutPage } from './pages/store/CheckoutPage';
import { OrderConfirmationPage } from './pages/store/OrderConfirmationPage';
import { AccountPage } from './pages/store/AccountPage';
import { MyOrdersPage } from './pages/store/MyOrdersPage';
import { WishlistPage } from './pages/store/WishlistPage';
import { BlogPage } from './pages/store/BlogPage';
import { BlogPostPage } from './pages/store/BlogPostPage';
import { CustomerAuthPage } from './pages/store/CustomerAuthPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage';
import { AdminSetsPage } from './pages/admin/AdminSetsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminBlogPage } from './pages/admin/AdminBlogPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminLogsPage } from './pages/admin/AdminLogsPage';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <BrowserRouter>
                <Routes>
                  {/* Storefront Routes */}
                  <Route path="/" element={<StoreLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="catalogo" element={<CatalogPage />} />
                    <Route path="produto/:id" element={<ProductDetailPage />} />
                    <Route path="carrinho" element={<CartPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="confirmacao-pedido/:id" element={<OrderConfirmationPage />} />
                    <Route path="minha-conta" element={<AccountPage />} />
                    <Route path="login" element={<CustomerAuthPage />} />
                    <Route path="cadastro" element={<CustomerAuthPage />} />
                    <Route path="meus-pedidos" element={<MyOrdersPage />} />
                    <Route path="favoritos" element={<WishlistPage />} />
                    <Route path="blog" element={<BlogPage />} />
                    <Route path="blog/:slug" element={<BlogPostPage />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="produtos" element={<AdminProductsPage />} />
                    <Route path="pedidos" element={<AdminOrdersPage />} />
                    <Route path="clientes" element={<AdminCustomersPage />} />
                    <Route path="avaliacoes" element={<AdminReviewsPage />} />
                    <Route path="promocoes" element={<AdminPromotionsPage />} />
                    <Route path="conjuntos" element={<AdminSetsPage />} />
                    <Route path="cupons" element={<AdminCouponsPage />} />
                    <Route path="blog" element={<AdminBlogPage />} />
                    <Route path="configuracoes" element={<AdminSettingsPage />} />
                    <Route path="usuarios" element={<AdminUsersPage />} />
                    <Route path="logs" element={<AdminLogsPage />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
