import React, { useState } from 'react';
import { 
  Heart, ShoppingBag, Trash2, ArrowRight, ShieldCheck, 
  ArrowLeft, Check, Layers, AlertTriangle, LogIn 
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Product } from '../types/index.ts';

interface WishlistViewProps {
  onNavigate: (view: string) => void;
  onSelectProduct: (slug: string) => void;
  onOpenQuickView: (product: any) => void;
}

export function WishlistView({ onNavigate, onSelectProduct, onOpenQuickView }: WishlistViewProps) {
  const { user } = useAuth();
  const { wishlistItems, wishlistCount, removeFromWishlist, addToCart } = useCart();
  const [notification, setNotification] = useState<string | null>(null);

  const handleQuickAdd = async (item: any) => {
    // Fetch product details to get first variant
    try {
      const res = await fetch(`/api/products/${item.slug}`);
      const data = await res.json();
      if (data.product?.variants && data.product.variants.length > 0) {
        const firstVariant = data.product.variants[0];
        const addRes = await addToCart(item.product_id, firstVariant.id, 1);
        if (addRes.success) {
          setNotification(`"${item.name}" berhasil ditambahkan ke keranjang!`);
          setTimeout(() => setNotification(null), 3000);
        } else {
          onOpenQuickView(data.product);
        }
      } else {
        onSelectProduct(item.slug);
      }
    } catch {
      onSelectProduct(item.slug);
    }
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Simpan Produk Favorit Anda</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Masuk ke akun SKYRA Anda untuk menyimpan papan selancar, perlengkapan diving, dan baju renang favorit serta mendapatkan notifikasi saat stok menipis.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('login')}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk Akun Sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Wishlist Anda Masih Kosong</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Klik tombol hati pada kartu produk atau halaman detail untuk menyimpan produk yang Anda minati ke daftar ini.
        </p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-1.5"
        >
          <span>Jelajahi Produk Samudera</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Wishlist Saya
            <span className="text-xs font-bold px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full">
              {wishlistCount} Barang
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar perlengkapan laut favorit yang tersimpan di akun Anda
          </p>
        </div>

        <button
          onClick={() => onNavigate('catalog')}
          className="text-xs font-bold text-cyan-700 hover:text-cyan-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lanjut Belanja</span>
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {wishlistItems.map((item) => {
          const hasDiscount = item.promo_price && item.promo_price < item.normal_price;
          const currentPrice = item.promo_price || item.normal_price;
          const stock = item.total_stock !== undefined ? item.total_stock : 10;
          const isOutOfStock = stock <= 0;
          const isLowStock = stock > 0 && stock <= 5;

          return (
            <div
              key={item.id}
              className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 hover:border-cyan-500/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Image */}
              <div
                onClick={() => onSelectProduct(item.slug)}
                className="relative w-full aspect-square bg-slate-100 overflow-hidden cursor-pointer"
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500'}
                  alt={item.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Remove from wishlist button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(item.product_id);
                  }}
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 hover:bg-white text-rose-600 shadow-md transition-all hover:scale-110"
                  title="Hapus dari Wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {hasDiscount && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-rose-600 text-white text-[11px] font-bold rounded-md shadow-sm">
                    Hemat
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col flex-1 p-4">
                <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                  <span className="font-semibold text-cyan-800 uppercase line-clamp-1">
                    {item.brand_name || 'SKYRA'}
                  </span>
                  <span>{item.category_name}</span>
                </div>

                <h3
                  onClick={() => onSelectProduct(item.slug)}
                  className="font-medium text-slate-800 text-sm line-clamp-2 hover:text-cyan-800 cursor-pointer transition-colors leading-snug mb-2 flex-1"
                >
                  {item.name}
                </h3>

                {/* Price and Stock */}
                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between mb-3">
                  <div>
                    <div className="text-base font-bold text-slate-900">
                      Rp {currentPrice.toLocaleString('id-ID')}
                    </div>
                    {hasDiscount && (
                      <div className="text-[11px] text-slate-600 line-through">
                        Rp {item.normal_price.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>

                  <div>
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                        Habis
                      </span>
                    ) : isLowStock ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Sisa {stock}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleQuickAdd(item)}
                  disabled={isOutOfStock}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isOutOfStock ? 'Stok Habis' : 'Pindah ke Keranjang'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
