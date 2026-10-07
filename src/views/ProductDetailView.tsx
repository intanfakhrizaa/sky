import React, { useState, useEffect } from 'react';
import { 
  Star, Heart, ShoppingBag, ShieldCheck, Truck, RotateCcw, 
  Layers, Plus, Minus, ArrowLeft, Check, AlertCircle, Share2 
} from 'lucide-react';
import { Product, ProductVariant } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';

interface ProductDetailViewProps {
  slug: string;
  onBack: () => void;
  onSelectProduct: (slug: string) => void;
  onOpenQuickView: (product: Product) => void;
  onGoToCart: () => void;
}

export function ProductDetailView({ slug, onBack, onSelectProduct, onOpenQuickView, onGoToCart }: ProductDetailViewProps) {
  const { addToCart, wishlistIds, toggleWishlist } = useCart();
  const { lastEvent } = useRealtime();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Review form state
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchProduct = () => {
    setIsLoading(true);
    fetch(`/api/products/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          setActiveImage(data.product.images?.[0]?.image_url || data.product.primary_image || '');
          if (data.product.variants && data.product.variants.length > 0) {
            setSelectedVariant(data.product.variants[0]);
          }
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  // When a stock update happens via Real-time SSE, refresh product stock!
  useEffect(() => {
    if (lastEvent && (lastEvent.type === 'STOCK_UPDATE' || lastEvent.type === 'PRICE_UPDATE')) {
      fetchProduct();
    }
  }, [lastEvent]);

  if (isLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex justify-center items-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Memuat rincian perlengkapan laut...</p>
        </div>
      </div>
    );
  }

  const currentVariant = selectedVariant || product.variants?.[0];
  const availableStock = currentVariant?.available_stock ?? 10;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;

  const basePrice = (product.promo_price || product.normal_price) + (currentVariant?.additional_price || 0);

  // Wholesale calculation
  let unitPrice = basePrice;
  let isWholesaleActive = false;
  if (product.wholesaleRules && product.wholesaleRules.length > 0) {
    for (const rule of product.wholesaleRules) {
      if (quantity >= rule.min_quantity && (rule.max_quantity === null || quantity <= rule.max_quantity)) {
        unitPrice = rule.price_per_unit;
        isWholesaleActive = true;
        break;
      }
    }
  }

  const subtotal = unitPrice * quantity;
  const isWishlisted = wishlistIds.has(product.id);

  const handleAddToCart = async (goToCart = false) => {
    if (!currentVariant) return;
    const res = await addToCart(product.id, currentVariant.id, quantity);
    if (res.success) {
      if (goToCart) {
        onGoToCart();
      } else {
        setNotification('Produk berhasil ditambahkan ke keranjang!');
        setTimeout(() => setNotification(null), 3500);
      }
    } else {
      setNotification(res.error || 'Gagal menambahkan produk');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('skyra_token') || ''}`,
        },
        body: JSON.stringify({
          rating: ratingInput,
          comment: commentInput.trim(),
          variant_title: currentVariant?.title,
        }),
      });
      if (res.ok) {
        setReviewSuccess(true);
        setCommentInput('');
        fetchProduct();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-cyan-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </button>

        <span className="text-xs text-slate-400">
          Kategori: <strong className="text-slate-700">{product.category_name}</strong> / {product.subcategory_name || 'Alat Laut'}
        </span>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
            <img
              src={activeImage || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900'}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.is_flash_sale === 1 && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-slate-900 text-xs font-black rounded-lg shadow uppercase">
                Flash Sale
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img.image_url)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImage === img.image_url
                      ? 'border-cyan-600 ring-2 ring-cyan-600/30'
                      : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pricing, Variants, Wholesale & Purchase */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-cyan-800 uppercase tracking-widest">
                {product.brand_name || 'SKYRA'}
              </span>
              <span className="text-slate-600 font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating and Reviews Counter */}
            <div className="flex items-center gap-3 mt-2 text-xs">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold text-slate-800 ml-1 text-sm">
                  {product.rating?.toFixed(1) || '5.0'}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">{product.review_count || 0} Ulasan Pelanggan</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">{product.sold_count || 0} Terjual</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  Rp {unitPrice.toLocaleString('id-ID')}
                </span>
                {product.promo_price && (
                  <span className="text-sm text-slate-400 line-through">
                    Rp {product.normal_price.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              {isWholesaleActive && (
                <span className="inline-block mt-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Harga Grosir Aktif (Hemat Rp {((basePrice - unitPrice) * quantity).toLocaleString('id-ID')})
                </span>
              )}
            </div>

            {/* Stock indicator badge */}
            <div>
              {isOutOfStock ? (
                <span className="px-3 py-1 bg-red-100 text-red-800 font-bold text-xs rounded-full">
                  Stok Habis
                </span>
              ) : isLowStock ? (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Sisa {availableStock} unit!
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Stok Siap ({availableStock} unit)
                </span>
              )}
            </div>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Pilih Varian Produk:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map((v) => {
                  const isSelected = currentVariant?.id === v.id;
                  const isVarOut = v.available_stock <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        if (quantity > v.available_stock && v.available_stock > 0) {
                          setQuantity(v.available_stock);
                        }
                      }}
                      disabled={isVarOut}
                      className={`p-3 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-50/60 ring-1 ring-cyan-600 shadow-sm'
                          : isVarOut
                          ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="font-semibold text-slate-900 line-clamp-1">{v.title}</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {isVarOut ? 'Habis' : `Stok: ${v.available_stock}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wholesale Rules (Buy More Save More) */}
          {product.wholesaleRules && product.wholesaleRules.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Layers className="w-4 h-4 text-emerald-700" />
                Tabel Harga Grosir Otomatis:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {product.wholesaleRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      quantity >= rule.min_quantity &&
                      (rule.max_quantity === null || quantity <= rule.max_quantity)
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="text-[11px]">
                      {rule.min_quantity}
                      {rule.max_quantity ? ` - ${rule.max_quantity}` : '+'} pcs
                    </div>
                    <div className="font-black mt-0.5">
                      Rp {rule.price_per_unit.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kuantiti:
              </span>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2.5 hover:bg-slate-100 disabled:opacity-40"
                >
                  <Minus className="w-4 h-4 text-slate-600" />
                </button>
                <span className="w-14 text-center text-sm font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  disabled={quantity >= availableStock || isOutOfStock}
                  className="p-2.5 hover:bg-slate-100 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="text-right ml-auto">
                <span className="text-xs text-slate-500 block">Subtotal:</span>
                <span className="text-lg font-black text-slate-900">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Notification alert */}
            {notification && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{notification}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleAddToCart(false)}
                disabled={isOutOfStock}
                className="py-3.5 px-6 rounded-xl border-2 border-cyan-700 text-cyan-800 hover:bg-cyan-50 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                + Keranjang Belanja
              </button>

              <button
                onClick={() => handleAddToCart(true)}
                disabled={isOutOfStock}
                className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 text-white font-extrabold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Beli Sekarang
              </button>
            </div>

            {/* Wishlist and Share */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isWishlisted
                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                {isWishlisted ? 'Tersimpan di Wishlist' : 'Tambah ke Wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Description */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-6">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Deskripsi &amp; Spesifikasi Teknis
        </h3>

        <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">
          {product.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 font-semibold block">Material:</span>
            <span className="text-slate-900 font-bold mt-0.5 block">{product.material || 'Marine Grade'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 font-semibold block">Dimensi:</span>
            <span className="text-slate-900 font-bold mt-0.5 block">{product.dimensions || 'Standar Spesifikasi'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 font-semibold block">Berat Pengiriman:</span>
            <span className="text-slate-900 font-bold mt-0.5 block">{product.weight_grams} gram</span>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Ulasan Pelanggan ({product.reviews?.length || 0})
          </h3>
          <span className="text-xs text-slate-500">Terverifikasi oleh Tim Laut SKYRA</span>
        </div>

        {/* Existing Reviews */}
        <div className="space-y-4">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.reviewer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-slate-900">{rev.reviewer_name}</span>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                {rev.variant_title && (
                  <span className="text-[10px] text-slate-400">Varian: {rev.variant_title}</span>
                )}
                <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">
              Belum ada ulasan untuk produk ini. Jadilah yang pertama memberikan ulasan!
            </p>
          )}
        </div>

        {/* Submit Review Form */}
        <form onSubmit={handleReviewSubmit} className="pt-6 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Tulis Ulasan Anda
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Beri Bintang:</span>
            <div className="flex gap-1 text-amber-500 cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  onClick={() => setRatingInput(star)}
                  className={`w-5 h-5 ${star <= ratingInput ? 'fill-current' : 'text-slate-300'}`}
                />
              ))}
            </div>
          </div>
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Bagikan pengalaman Anda menggunakan produk ini di laut..."
            rows={3}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Kirim Ulasan
          </button>
          {reviewSuccess && (
            <span className="text-xs text-emerald-600 font-semibold ml-3">
              Ulasan Anda berhasil dikirim!
            </span>
          )}
        </form>
      </div>

      {/* Related Products Carousel */}
      {product.related && product.related.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Produk Terkait Lainnya</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {product.related.map((rp: any) => (
              <div
                key={rp.id}
                onClick={() => onSelectProduct(rp.slug)}
                className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer group"
              >
                <img
                  src={rp.primary_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'}
                  alt=""
                  className="w-full aspect-square object-cover rounded-xl mb-2 group-hover:scale-105 transition-transform"
                />
                <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-cyan-700">
                  {rp.name}
                </h4>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  Rp {(rp.promo_price || rp.normal_price).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
