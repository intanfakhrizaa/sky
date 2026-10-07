import React from 'react';
import { Star, Heart, ShoppingBag, Layers, AlertTriangle } from 'lucide-react';
import { Product } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface ProductCardProps {
  product: Product;
  onOpenQuickView: (product: Product) => void;
  onSelectProduct: (productSlug: string) => void;
}

export function ProductCard({ product, onOpenQuickView, onSelectProduct }: ProductCardProps) {
  const { wishlistIds, toggleWishlist } = useCart();
  const isWishlisted = wishlistIds.has(product.id);

  const hasDiscount = product.promo_price && product.promo_price < product.normal_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.normal_price - (product.promo_price || 0)) / product.normal_price) * 100)
    : 0;

  const currentPrice = product.promo_price || product.normal_price;
  const stock = product.total_available_stock !== undefined ? product.total_available_stock : 10;
  const isLowStock = stock > 0 && stock <= 5;
  const isOutOfStock = stock <= 0;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-cyan-500/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Image Container */}
      <div 
        className="relative w-full aspect-square bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => onSelectProduct(product.slug)}
      >
        <img
          src={product.primary_image || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {hasDiscount && (
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[11px] font-bold rounded-md shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.is_flash_sale === 1 && (
            <span className="px-2 py-0.5 bg-amber-500 text-slate-900 text-[10px] font-extrabold uppercase tracking-wide rounded-md shadow-sm">
              Flash Sale
            </span>
          )}
          {(product as any).has_wholesale > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md shadow-sm">
              <Layers className="w-3 h-3" />
              Grosir
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600'
              : 'bg-white/80 text-slate-600 hover:text-rose-600 hover:bg-white'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Hover Action */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenQuickView(product);
            }}
            disabled={isOutOfStock}
            className="w-full py-2 px-3 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl backdrop-blur-sm flex items-center justify-center gap-1.5 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {isOutOfStock ? 'Stok Habis' : 'Pilih Varian & Beli'}
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category & Brand */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
          <span className="font-semibold text-cyan-800 uppercase tracking-wider line-clamp-1">
            {product.brand_name || 'SKYRA'}
          </span>
          <span className="line-clamp-1">{product.category_name}</span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelectProduct(product.slug)}
          className="font-medium text-slate-800 text-sm line-clamp-2 hover:text-cyan-800 cursor-pointer transition-colors leading-snug mb-2 flex-1"
        >
          {product.name}
        </h3>

        {/* Rating and Sold count */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold text-slate-700 ml-1 text-xs">
              {product.rating?.toFixed(1) || '5.0'}
            </span>
          </div>
          <span>•</span>
          <span className="text-[11px]">{product.sold_count || 0} terjual</span>
        </div>

        {/* Price Section */}
        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between gap-1">
          <div>
            <div className="text-base font-bold text-slate-900">
              Rp {currentPrice.toLocaleString('id-ID')}
            </div>
            {hasDiscount && (
              <div className="text-[11px] text-slate-600 line-through">
                Rp {product.normal_price.toLocaleString('id-ID')}
              </div>
            )}
          </div>

          {/* Stock Tag */}
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
      </div>
    </div>
  );
}
