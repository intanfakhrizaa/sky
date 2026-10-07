import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { RealtimeProvider } from './context/RealtimeContext.tsx';
import { CartProvider } from './context/CartContext.tsx';

import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { VisualSearchModal } from './components/VisualSearchModal.tsx';
import { QuickViewModal } from './components/QuickViewModal.tsx';

import { HomeView } from './views/HomeView.tsx';
import { CatalogView } from './views/CatalogView.tsx';
import { ProductDetailView } from './views/ProductDetailView.tsx';
import { CartView } from './views/CartView.tsx';
import { CheckoutView } from './views/CheckoutView.tsx';
import { OrderDetailView } from './views/OrderDetailView.tsx';
import { OrdersListView } from './views/OrdersListView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { LoginView } from './views/LoginView.tsx';
import { AdminView } from './views/AdminView.tsx';

import { Product } from './types/index.ts';

function MainApp() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [catalogCategory, setCatalogCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>('');

  // Modals
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const handleNavigate = (view: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'catalog') {
      setCatalogCategory(param || '');
      setSearchQuery('');
    }
    setCurrentView(view);
  };

  const handleSearch = (query: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchQuery(query);
    setCatalogCategory('');
    setCurrentView('catalog');
  };

  const handleSelectProduct = (slug: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedProductSlug(slug);
    setCurrentView('product_detail');
  };

  const handleSelectOrder = (orderNumber: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedOrderNumber(orderNumber);
    setCurrentView('order_detail');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* If in Admin view, render full admin panel */}
      {currentView === 'admin' ? (
        <AdminView onBackToStore={() => setCurrentView('home')} />
      ) : (
        <>
          <Navbar
            currentView={currentView}
            onNavigate={handleNavigate}
            onSearch={handleSearch}
            onOpenVisualSearch={() => setIsVisualSearchOpen(true)}
          />

          <main className="flex-1">
            {currentView === 'home' && (
              <HomeView
                onNavigate={handleNavigate}
                onOpenQuickView={(p) => setQuickViewProduct(p)}
                onSelectProduct={handleSelectProduct}
                onOpenVisualSearch={() => setIsVisualSearchOpen(true)}
              />
            )}

            {currentView === 'catalog' && (
              <CatalogView
                initialCategory={catalogCategory}
                initialQuery={searchQuery}
                onOpenQuickView={(p) => setQuickViewProduct(p)}
                onSelectProduct={handleSelectProduct}
                onOpenVisualSearch={() => setIsVisualSearchOpen(true)}
              />
            )}

            {currentView === 'product_detail' && (
              <ProductDetailView
                slug={selectedProductSlug}
                onBack={() => setCurrentView('catalog')}
                onSelectProduct={handleSelectProduct}
                onOpenQuickView={(p) => setQuickViewProduct(p)}
                onGoToCart={() => setCurrentView('cart')}
              />
            )}

            {currentView === 'cart' && (
              <CartView
                onNavigate={handleNavigate}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {currentView === 'checkout' && (
              <CheckoutView
                onBack={() => setCurrentView('cart')}
                onOrderSuccess={(orderNum) => {
                  setSelectedOrderNumber(orderNum);
                  setCurrentView('order_detail');
                }}
              />
            )}

            {currentView === 'order_detail' && (
              <OrderDetailView
                orderNumber={selectedOrderNumber}
                onBack={() => setCurrentView('orders')}
              />
            )}

            {currentView === 'orders' && (
              <OrdersListView
                onSelectOrder={handleSelectOrder}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'profile' && <ProfileView />}

            {currentView === 'login' && (
              <LoginView onSuccess={() => setCurrentView('home')} />
            )}
          </main>

          <Footer />

          {/* Global Modals */}
          <VisualSearchModal
            isOpen={isVisualSearchOpen}
            onClose={() => setIsVisualSearchOpen(false)}
            onSelectProduct={handleSelectProduct}
          />

          <QuickViewModal
            product={quickViewProduct}
            isOpen={!!quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
            onGoToCart={() => setCurrentView('cart')}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}
