import React from 'react';
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, 
  Layers, CheckSquare, Square, ShieldCheck, ArrowLeft 
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartViewProps {
  onNavigate: (view: string) => void;
  onSelectProduct: (slug: string) => void;
}

export function CartView({ onNavigate, onSelectProduct }: CartViewProps) {
  const { items, summary, updateQuantity, toggleSelect, selectAll, removeItem } = useCart();

  const allSelected = items.length > 0 && items.every((i) => i.is_selected === 1);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-cyan-50 text-cyan-700 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Anda belum memilih perlengkapan laut atau selancar. Yuk jelajahi katalog produk kami!
        </p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-1.5"
        >
          <span>Mulai Belanja</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Keranjang Belanja ({items.length} Barang)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Harga grosir otomatis diperbarui setiap kali kuantiti bertambah
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Select All Bar */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
            <button
              onClick={() => selectAll(!allSelected)}
              className="flex items-center gap-2 text-xs font-bold text-slate-800"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-cyan-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Pilih Semua Barang ({items.length})</span>
            </button>

            <span className="text-xs text-slate-500">
              {summary.selectedCount} produk terpilih
            </span>
          </div>

          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
              >
                {/* Checkbox and Product Thumbnail */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => toggleSelect(item.id, item.is_selected === 0)}
                    className="flex-shrink-0"
                  >
                    {item.is_selected === 1 ? (
                      <CheckSquare className="w-5 h-5 text-cyan-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <img
                    src={
                      item.image_url ||
                      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200'
                    }
                    alt={item.product_name}
                    className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-100 flex-shrink-0 cursor-pointer"
                    onClick={() => onSelectProduct(item.product_slug)}
                  />

                  <div className="flex-1 min-w-0">
                    <h3
                      onClick={() => onSelectProduct(item.product_slug)}
                      className="font-bold text-slate-900 text-sm hover:text-cyan-800 cursor-pointer line-clamp-1"
                    >
                      {item.product_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Varian: <strong className="text-slate-700">{item.variant_title}</strong> (SKU: {item.variant_sku})
                    </p>

                    {item.isWholesale && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        <Layers className="w-3 h-3" />
                        Grosir Aktif (Hemat Rp {item.totalSavings.toLocaleString('id-ID')})
                      </span>
                    )}
                  </div>
                </div>

                {/* Price, Quantity & Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-extrabold text-slate-900">
                      Rp {item.itemSubtotal.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      @ Rp {item.unitPrice.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Quantity Control */}
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-1.5 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <span className="w-10 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.available_stock}
                      className="p-1.5 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-4">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6 sticky top-28">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">
              Ringkasan Belanja
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Barang Terpilih</span>
                <span className="font-bold text-slate-800">{summary.selectedCount} unit</span>
              </div>

              {summary.totalWholesaleSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Hemat Harga Grosir
                  </span>
                  <span>-Rp {summary.totalWholesaleSavings.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim</span>
                <span className="text-slate-400 italic">Dihitung di checkout</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Harga:</span>
                <span className="text-2xl font-black text-slate-900">
                  Rp {summary.subtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('checkout')}
              disabled={summary.selectedCount === 0}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Lanjut ke Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <span>Transaksi aman &amp; garansi uang kembali 100% jika barang tidak sesuai.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
