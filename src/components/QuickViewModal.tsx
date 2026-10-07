import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, Plus, Minus, Layers, AlertCircle, Sparkles } from 'lucide-react';
import { Product, ProductVariant } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToCart: () => void;
}

export function QuickViewModal({ product, isOpen, onClose, onGoToCart }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [fullProduct, setFullProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (product && isOpen) {
      // Fetch fresh product with variants & wholesale tiers
      fetch(`/api/products/${product.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.product) {
            setFullProduct(data.product);
            if (data.product.variants && data.product.variants.length > 0) {
              setSelectedVariant(data.product.variants[0]);
            }
          }
        })
        .catch(() => {
          setFullProduct(product);
          if (product.variants && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
          }
        });
      setQuantity(1);
      setNotification(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !fullProduct) return null;

  const currentVariant = selectedVariant || fullProduct.variants?.[0];
  const availableStock = currentVariant?.available_stock ?? 10;
  const isOutOfStock = availableStock <= 0;

  const basePrice = (fullProduct.promo_price || fullProduct.normal_price) + (currentVariant?.additional_price || 0);

  // Calculate Wholesale Price for currently selected quantity
  let unitPrice = basePrice;
  let isWholesaleActive = false;
  if (fullProduct.wholesaleRules && fullProduct.wholesaleRules.length > 0) {
    for (const rule of fullProduct.wholesaleRules) {
      if (quantity >= rule.min_quantity && (rule.max_quantity === null || quantity <= rule.max_quantity)) {
        unitPrice = rule.price_per_unit;
        isWholesaleActive = true;
        break;
      }
    }
  }

  const subtotal = unitPrice * quantity;

  const handleAdd = async (goToCartAfter = false) => {
    if (!currentVariant) return;
    setIsAdding(true);
    const result = await addToCart(fullProduct.id, currentVariant.id, quantity);
    setIsAdding(false);

    if (result.success) {
      if (goToCartAfter) {
        onClose();
        onGoToCart();
      } else {
        setNotification('Produk berhasil masuk ke keranjang!');
        setTimeout(() => setNotification(null), 3000);
      }
    } else {
      setNotification(result.error || 'Gagal menambahkan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white text-slate-500 hover:text-slate-800 rounded-full shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square md:aspect-auto bg-slate-100 overflow-hidden">
            <img
              src={
                fullProduct.images?.[0]?.image_url ||
                fullProduct.primary_image ||
                'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
              }
              alt={fullProduct.name}
              className="w-full h-full object-cover"
            />
            {isWholesaleActive && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                Harga Grosir Aktif!
              </div>
            )}
          </div>

          {/* Details & Controls */}
          <div className="p-6 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
            <div>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
                {fullProduct.brand_name || 'SKYRA'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
                {fullProduct.name}
              </h2>

              {/* Price display */}
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  Rp {unitPrice.toLocaleString('id-ID')}
                </span>
                {fullProduct.promo_price && (
                  <span className="text-xs text-slate-400 line-through">
                    Rp {fullProduct.normal_price.toLocaleString('id-ID')}
                  </span>
                )}
                {isWholesaleActive && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Hemat Rp {((basePrice - unitPrice) * quantity).toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              {/* Variant Selector */}
              {fullProduct.variants && fullProduct.variants.length > 0 && (
                <div className="mt-5 space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Pilih Varian / Ukuran / Warna:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {fullProduct.variants.map((variant) => {
                      const isSelected = currentVariant?.id === variant.id;
                      const isVarOut = variant.available_stock <= 0;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => {
                            setSelectedVariant(variant);
                            if (quantity > variant.available_stock && variant.available_stock > 0) {
                              setQuantity(variant.available_stock);
                            }
                          }}
                          disabled={isVarOut}
                          className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                            isSelected
                              ? 'border-cyan-600 bg-cyan-50/50 shadow-sm ring-1 ring-cyan-600'
                              : isVarOut
                              ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span className="font-semibold text-slate-800 line-clamp-1">
                            {variant.title}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1">
                            {isVarOut ? 'Stok Habis' : `Stok: ${variant.available_stock}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Wholesale Tiers Table */}
              {fullProduct.wholesaleRules && fullProduct.wholesaleRules.length > 0 && (
                <div className="mt-5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Tingkat Harga Grosir (Beli Banyak Makin Hemat):
                  </div>
                  <div className="space-y-1 text-xs">
                    {fullProduct.wholesaleRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between py-1 px-2 rounded-md ${
                          quantity >= rule.min_quantity &&
                          (rule.max_quantity === null || quantity <= rule.max_quantity)
                            ? 'bg-emerald-100 font-bold text-emerald-900'
                            : 'text-slate-600'
                        }`}
                      >
                        <span>
                          {rule.min_quantity}
                          {rule.max_quantity ? ` - ${rule.max_quantity}` : '+'} pcs
                        </span>
                        <span>Rp {rule.price_per_unit.toLocaleString('id-ID')}/pcs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Picker */}
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Jumlah Pembelian:
                  </span>
                  <span className="text-xs text-slate-500">
                    {isOutOfStock ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Stok Varian Habis
                      </span>
                    ) : (
                      `Tersedia ${availableStock} unit`
                    )}
                  </span>
                </div>

                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    disabled={quantity >= availableStock || isOutOfStock}
                    className="p-2 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notification / Alert */}
            {notification && (
              <div className="mt-4 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{notification}</span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Total Estimasi ({quantity} barang):</span>
                <span className="text-base font-extrabold text-slate-900">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAdd(false)}
                  disabled={isOutOfStock || isAdding}
                  className="py-3 px-4 rounded-xl border border-cyan-700 text-cyan-800 hover:bg-cyan-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  + Keranjang
                </button>
                <button
                  onClick={() => handleAdd(true)}
                  disabled={isOutOfStock || isAdding}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  Beli Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
