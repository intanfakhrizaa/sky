import React, { useState, useEffect } from 'react';
import { 
  Waves, Compass, Sparkles, ArrowRight, ShieldCheck, 
  Layers, Flame, Clock, ChevronRight, Anchor
} from 'lucide-react';
import { Product, Category } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenQuickView: (product: Product) => void;
  onSelectProduct: (productSlug: string) => void;
  onOpenVisualSearch: () => void;
}

export function HomeView({ onNavigate, onOpenQuickView, onSelectProduct, onOpenVisualSearch }: HomeViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [countdown, setCountdown] = useState({ hours: 7, minutes: 24, seconds: 45 });

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));

    // Fetch featured products
    fetch('/api/products?limit=8&sort=relevance')
      .then((res) => res.json())
      .then((data) => setFeaturedProducts(data.products || []));

    // Fetch flash sale items
    fetch('/api/flash-sale')
      .then((res) => res.json())
      .then((data) => setFlashSaleProducts(data.items || []));

    // Fetch best sellers
    fetch('/api/products?limit=8&sort=best-selling')
      .then((res) => res.json())
      .then((data) => setBestSellers(data.products || []));

    // Countdown timer interval
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white py-16 sm:py-24 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-600/20 via-sky-900/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Pusat Perlengkapan Samudera &amp; Watersports No. 1</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Kuasai Ombak, <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                Jelajahi Lautan Dalam.
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
              Koleksi lengkap papan selancar carbon, wetsuit, masker diving frameless, paddle board SUP tiup, life jacket bersertifikasi SOLAS, dan busana laut dengan sistem harga grosir otomatis.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onNavigate('catalog')}
                className="px-6 py-3.5 bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <span>Jelajahi Katalog Lengkap</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenVisualSearch}
                className="px-5 py-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Cari Pakai Foto (Visual Search)</span>
              </button>
            </div>

            {/* Quick stats pills */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-md">
              <div>
                <span className="text-2xl font-black text-cyan-400">50+</span>
                <p className="text-xs text-slate-400">Kategori &amp; Alat</p>
              </div>
              <div>
                <span className="text-2xl font-black text-white">100%</span>
                <p className="text-xs text-slate-400">Real-Time Stock</p>
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-400">B2B</span>
                <p className="text-xs text-slate-400">Tingkat Grosir</p>
              </div>
            </div>
          </div>

          {/* Hero Banner Floating Visuals */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-800 group">
              <img
                src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=900"
                alt="Skyra Surfing Collection"
                className="w-full h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 mb-1 block">
                  Koleksi Pilihan
                </span>
                <h3 className="text-xl font-black text-white">
                  Apex Pro Carbon Shortboard
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  Didesain untuk manuver ombak cepat di Uluwatu &amp; Mentawai dengan konstruksi karbon ultra-responsif.
                </p>
                <button
                  onClick={() => onNavigate('catalog', 'surfing')}
                  className="mt-3 px-4 py-2 bg-white text-slate-950 text-xs font-bold rounded-lg hover:bg-cyan-300 transition-colors inline-flex items-center gap-1.5"
                >
                  Lihat Seri Selancar &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Kategori Pilihan</span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Eksplorasi Perlengkapan Air</h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
          >
            Lihat Semua Kategori &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('catalog', cat.slug)}
              className="group relative flex flex-col items-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-lg transition-all duration-200 cursor-pointer text-center"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden mb-2.5 bg-slate-100 group-hover:scale-105 transition-transform">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xs font-bold text-slate-800 group-hover:text-cyan-700 transition-colors">
                {cat.name}
              </h3>
              <span className="text-[10px] text-slate-600 mt-0.5 line-clamp-1">
                {cat.subcategories?.length || 5}+ Subkategori
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sale Section */}
      {flashSaleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-xl mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                  <Flame className="w-7 h-7 text-white animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Flash Sale Samudera</h2>
                    <span className="px-2 py-0.5 bg-white text-orange-600 text-xs font-black rounded-full uppercase">
                      Terbatas
                    </span>
                  </div>
                  <p className="text-xs text-white/90 mt-0.5">Diskon kilat s.d 40% untuk produk watersports &amp; diving pilihan</p>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl">
                <Clock className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-semibold mr-1">Berakhir dalam:</span>
                <span className="px-2 py-1 bg-white text-slate-950 font-black text-xs rounded-md">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="font-bold">:</span>
                <span className="px-2 py-1 bg-white text-slate-950 font-black text-xs rounded-md">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="font-bold">:</span>
                <span className="px-2 py-1 bg-white text-slate-950 font-black text-xs rounded-md">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {flashSaleProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpenQuickView={onOpenQuickView}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* Wholesale Promotional Banner (Buy More Save More) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-xs font-bold">
                <Layers className="w-3.5 h-3.5" />
                SISTEM HARGA GROSIR REAL-TIME
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Beli Banyak Makin Hemat untuk Dive Center &amp; Surf Club
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Nikmati potongan harga bertingkat langsung saat Anda menambah kuantiti produk ke keranjang. Cocok untuk pengelola resort pantai, dive center, persewaan papan surfing, dan institusi maritim.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-2 text-xs">
                <span className="px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700 text-slate-300">
                  Tier 1: <strong className="text-white">5–9 pcs</strong> (Hemat s.d 10%)
                </span>
                <span className="px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700 text-slate-300">
                  Tier 2: <strong className="text-white">10–49 pcs</strong> (Hemat s.d 20%)
                </span>
                <span className="px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700 text-slate-300">
                  Tier 3: <strong className="text-white">50+ pcs</strong> (Harga Distributor)
                </span>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={() => onNavigate('catalog')}
                className="w-full md:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-colors"
              >
                Cek Katalog Produk Grosir &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Rekomendasi Kapten</span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Produk Unggulan Samudera</h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
          >
            Semua Produk &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onOpenQuickView={onOpenQuickView}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Paling Laris</span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Best Seller Pilihan Penyelam &amp; Peselancar</h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
          >
            Lihat Terlaris &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestSellers.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onOpenQuickView={onOpenQuickView}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
