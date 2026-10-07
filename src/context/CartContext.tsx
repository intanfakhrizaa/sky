import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem } from '../types/index.ts';
import { useAuth } from './AuthContext.tsx';
import { useRealtime } from './RealtimeContext.tsx';

interface CartSummary {
  subtotal: number;
  totalWholesaleSavings: number;
  selectedCount: number;
  itemCount: number;
}

interface CartContextType {
  items: CartItem[];
  summary: CartSummary;
  wishlistCount: number;
  isLoading: boolean;
  addToCart: (productId: number, variantId: number, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  toggleSelect: (itemId: number, isSelected: boolean) => Promise<void>;
  selectAll: (select: boolean) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  wishlistIds: Set<number>;
  toggleWishlist: (productId: number) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate stable session id for guests
const getSessionId = () => {
  let sId = localStorage.getItem('skyra_session_id');
  if (!sId) {
    sId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('skyra_session_id', sId);
  }
  return sId;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const { lastEvent } = useRealtime();

  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    totalWholesaleSavings: 0,
    selectedCount: 0,
    itemCount: 0
  });
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-session-id': getSessionId()
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSummary(data.summary || { subtotal: 0, totalWholesaleSavings: 0, selectedCount: 0, itemCount: 0 });
      }
    } catch (err) {
      console.error('Failed to load cart', err);
    }
  }, [getHeaders]);

  const refreshWishlist = useCallback(async () => {
    if (!token) {
      setWishlistCount(0);
      setWishlistIds(new Set());
      return;
    }
    try {
      const res = await fetch('/api/wishlist', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = data.wishlist || [];
        setWishlistCount(list.length);
        setWishlistIds(new Set(list.map((item: any) => item.product_id)));
      }
    } catch (err) {
      console.error('Failed to load wishlist', err);
    }
  }, [token, getHeaders]);

  useEffect(() => {
    refreshCart();
    refreshWishlist();
  }, [user, refreshCart, refreshWishlist]);

  // When a stock update or price update happens via Real-time SSE, refresh cart!
  useEffect(() => {
    if (lastEvent && (lastEvent.type === 'STOCK_UPDATE' || lastEvent.type === 'PRICE_UPDATE')) {
      refreshCart();
    }
  }, [lastEvent, refreshCart]);

  const addToCart = async (productId: number, variantId: number, quantity = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, variantId, quantity })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal menambahkan ke keranjang' };
      }
      await refreshCart();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Kesalahan jaringan' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ quantity })
      });
      await refreshCart();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelect = async (itemId: number, isSelected: boolean) => {
    try {
      await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ is_selected: isSelected })
      });
      await refreshCart();
    } catch (err) {
      console.error(err);
    }
  };

  const selectAll = async (select: boolean) => {
    try {
      await fetch('/api/cart/select-all', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ select })
      });
      await refreshCart();
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      await refreshCart();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWishlist = async (productId: number) => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      await refreshWishlist();
      return data.inWishlist;
    } catch {
      return false;
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      summary,
      wishlistCount,
      isLoading,
      addToCart,
      updateQuantity,
      toggleSelect,
      selectAll,
      removeItem,
      refreshCart,
      refreshWishlist,
      wishlistIds,
      toggleWishlist
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
