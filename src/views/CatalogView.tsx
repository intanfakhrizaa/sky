import React, { useState, useEffect } from 'react';
import { 
  Filter, X, SlidersHorizontal, ArrowUpDown, 
  Search, Camera, Check, ChevronDown, ChevronRight, Sparkles, Tag, RotateCcw
} from 'lucide-react';
import { Product, Category, Brand } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';

export interface PricePreset {
  id: string;
  label: string;
  shortLabel: string;
  usdEquivalent: string;
  min: string;
  max: string;
}

export const PRICE_PRESETS: PricePreset[] = [
  { id: 'all', label: 'Semua Harga', shortLabel: 'Semua Harga', usdEquivalent: 'All Prices', min: '', max: '' },
  { id: 'tier1', label: 'Di bawah Rp 250.000', shortLabel: '< Rp 250rb', usdEquivalent: '$0 - $15', min: '', max: '250000' },
  { id: 'tier2', label: 'Rp 250.000 - Rp 750.000', shortLabel: 'Rp 250rb - 750rb', usdEquivalent: '$15 - $50', min: '250000', max: '750000' },
  { id: 'tier3', label: 'Rp 750.000 - Rp 2.500.000', shortLabel: 'Rp 750rb - 2.5jt', usdEquivalent: '$50 - $150', min: '750000', max: '2500000' },
  { id: 'tier4', label: 'Rp 2.500.000 - Rp 5.000.000', shortLabel: 'Rp 2.5jt - 5jt', usdEquivalent: '$150 - $300', min: '2500000', max: '5000000' },
  { id: 'tier5', label: 'Di atas Rp 5.000.000', shortLabel: '> Rp 5jt', usdEquivalent: '$300+', min: '5000000', max: '' },
];

export function formatPriceLabel(min: string, max: string) {
  if (min && max) {
    return `Rp ${Number(min).toLocaleString('id-ID')} - Rp ${Number(max).toLocaleString('id-ID')}`;
  }
  if (min && !max) {
    return `≥ Rp ${Number(min).toLocaleString('id-ID')}`;
  }
  if (!min && max) {
    return `≤ Rp ${Number(max).toLocaleString('id-ID')}`;
  }
  return '';
}

interface CatalogViewProps {
  initialCategory?: string;
  initialQuery?: string;
  onOpenQuickView: (product: Product) => void;
  onSelectProduct: (productSlug: string) => void;
  onOpenVisualSearch: () => void;
}

export function CatalogView({
  initialCategory,
  initialQuery,
  onOpenQuickView,
  onSelectProduct,
  onOpenVisualSearch,
}: CatalogViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery || '');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [inputMin, setInputMin] = useState<string>('');
  const [inputMax, setInputMax] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Active price preset detection
  const activePreset = PRICE_PRESETS.find(
    (p) => p.min === minPrice && p.max === maxPrice
  ) || (minPrice === '' && maxPrice === '' ? PRICE_PRESETS[0] : null);

  const handleSelectPricePreset = (preset: PricePreset) => {
    setInputMin(preset.min);
    setInputMax(preset.max);
    setMinPrice(preset.min);
    setMaxPrice(preset.max);
    setPage(1);
  };

  const handleApplyCustomPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMinPrice(inputMin.trim());
    setMaxPrice(inputMax.trim());
    setPage(1);
  };

  // Sync props if changed
  useEffect(() => {
    if (initialCategory !== undefined) setSelectedCategory(initialCategory);
    if (initialQuery !== undefined) setSearchQuery(initialQuery);
    setPage(1);
  }, [initialCategory, initialQuery]);

  // Load Categories & Brands
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((d) => setCategories(d.categories || []));

    fetch('/api/brands')
      .then((res) => res.json())
      .then((d) => setBrands(d.brands || []));
  }, []);

  // Fetch filtered products
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory && selectedCategory !== 'flash-sale') params.append('category', selectedCategory);
    if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
    if (selectedBrand) params.append('brand', selectedBrand);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);
    if (sortBy) params.append('sort', sortBy);
    params.append('page', String(page));
    params.append('limit', '12');

    const endpoint = selectedCategory === 'flash-sale' ? '/api/flash-sale' : `/api/products?${params.toString()}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (selectedCategory === 'flash-sale') {
          setProducts(data.items || []);
          setPagination({ total: data.items?.length || 0, totalPages: 1 });
        } else {
          setProducts(data.products || []);
          setPagination(data.pagination || { total: 0, totalPages: 1 });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [selectedCategory, selectedSubcategory, selectedBrand, searchQuery, minPrice, maxPrice, sortBy, page]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBrand('');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setInputMin('');
    setInputMax('');
    setSortBy('relevance');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header and Search Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Katalog Produk Perlengkapan Laut
            {selectedCategory && (
              <span className="text-xs font-bold uppercase px-2.5 py-1 bg-cyan-100 text-cyan-800 rounded-full">
                {selectedCategory}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Menampilkan {pagination.total} produk siap kirim ke seluruh perairan Nusantara
          </p>
        </div>

        {/* Visual search shortcut & Mobile Filter Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenVisualSearch}
            className="px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold rounded-xl border border-cyan-200 flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-4 h-4 text-cyan-600" />
            <span>Search by Image</span>
          </button>

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden px-3.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block space-y-6">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-cyan-700" />
                Filter Pencarian
              </h3>
              {(selectedCategory || selectedBrand || minPrice || maxPrice || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Keyword Search Input in Sidebar */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Kata Kunci
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cth: Shortboard, Diving Mask..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-cyan-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Categories Filter */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Kategori
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedSubcategory('');
                    setPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === ''
                      ? 'bg-cyan-50 text-cyan-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setSelectedSubcategory('');
                      setPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-cyan-50 text-cyan-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {selectedCategory === cat.slug && (
                      <Check className="w-3.5 h-3.5 text-cyan-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategories (if Category selected) */}
            {selectedCategory && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Subkategori
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {categories
                    .find((c) => c.slug === selectedCategory)
                    ?.subcategories?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubcategory(selectedSubcategory === sub.slug ? '' : sub.slug);
                          setPage(1);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${
                          selectedSubcategory === sub.slug
                            ? 'bg-sky-100 text-sky-900 font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <span>{sub.name}</span>
                        {selectedSubcategory === sub.slug && (
                          <Check className="w-3 h-3 text-sky-700" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Brands Filter */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Brand Maritim
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedBrand('');
                    setPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedBrand === ''
                      ? 'bg-cyan-50 text-cyan-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Semua Brand
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBrand(selectedBrand === b.slug ? '' : b.slug);
                      setPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedBrand === b.slug
                        ? 'bg-cyan-50 text-cyan-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{b.name}</span>
                    {selectedBrand === b.slug && (
                      <Check className="w-3.5 h-3.5 text-cyan-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter (Sidebar) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Rentang Harga
                </label>
                {(minPrice || maxPrice) && (
                  <button
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      setInputMin('');
                      setInputMax('');
                      setPage(1);
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Preset Price Options */}
              <div className="space-y-1 mb-3">
                {PRICE_PRESETS.map((preset) => {
                  const isSelected = activePreset?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPricePreset(preset)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-50 border border-cyan-400 text-cyan-900 font-bold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <span className="truncate">{preset.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-700 flex-shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Min/Max Input Form */}
              <form onSubmit={handleApplyCustomPrice} className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Atau tentukan harga sendiri:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={inputMin}
                      onChange={(e) => setInputMin(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={inputMax}
                      onChange={(e) => setInputMax(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  Terapkan Filter Harga
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main Products Grid Column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top-Bar Quick Price Filter Carousel */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-600" />
                <span>Filter Cepat Rentang Harga:</span>
              </span>
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    setInputMin('');
                    setInputMax('');
                    setPage(1);
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Hapus Filter Harga</span>
                </button>
              )}
            </div>

            {/* Horizontal Scrollable Price Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {PRICE_PRESETS.map((p) => {
                const isSelected = activePreset?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPricePreset(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm font-bold'
                        : 'bg-slate-50 hover:bg-cyan-50/70 text-slate-700 border-slate-200 hover:border-cyan-300'
                    }`}
                  >
                    <span>{p.shortLabel}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-cyan-100' : 'text-slate-400'}`}>
                      ({p.usdEquivalent})
                    </span>
                    {isSelected && p.id !== 'all' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Sort Controls & Active Filter Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-cyan-500"
              >
                <option value="relevance">Paling Relevan</option>
                <option value="price-low">Harga: Rendah ke Tinggi</option>
                <option value="price-high">Harga: Tinggi ke Rendah</option>
                <option value="best-selling">Paling Laris</option>
                <option value="newest">Produk Terbaru</option>
                <option value="rating">Rating Tertinggi</option>
              </select>
            </div>

            {/* Active filter badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {searchQuery && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md flex items-center gap-1 font-medium">
                  Cari: "{searchQuery}"
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-600"
                    onClick={() => setSearchQuery('')}
                  />
                </span>
              )}
              {selectedBrand && (
                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-md flex items-center gap-1 font-medium">
                  Brand: {selectedBrand}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-600"
                    onClick={() => setSelectedBrand('')}
                  />
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-900 rounded-md flex items-center gap-1 font-semibold border border-cyan-300">
                  <Tag className="w-3 h-3 text-cyan-700" />
                  <span>Harga: {formatPriceLabel(minPrice, maxPrice)}</span>
                  <X
                    className="w-3.5 h-3.5 cursor-pointer hover:text-rose-600"
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      setInputMin('');
                      setInputMax('');
                      setPage(1);
                    }}
                  />
                </span>
              )}
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 py-12">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-slate-100 animate-pulse rounded-2xl border border-slate-200"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tidak ada produk ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Coba ubah kata kunci atau hapus filter harga/kategori untuk menemukan perlengkapan laut lainnya.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl shadow"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onOpenQuickView={onOpenQuickView}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg disabled:opacity-40"
              >
                &larr; Sebelumnya
              </button>
              <span className="text-xs text-slate-600 px-2 font-medium">
                Halaman {page} dari {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg disabled:opacity-40"
              >
                Selanjutnya &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Slide-over Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs h-full bg-white shadow-2xl p-5 overflow-y-auto z-10 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-700" />
                  <span>Filter Produk</span>
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Price Range Filter (Mobile) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Rentang Harga</span>
                  </span>
                  {(minPrice || maxPrice) && (
                    <button
                      onClick={() => {
                        setMinPrice('');
                        setMaxPrice('');
                        setInputMin('');
                        setInputMax('');
                        setPage(1);
                      }}
                      className="text-[11px] text-rose-600 font-semibold hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {PRICE_PRESETS.map((preset) => {
                    const isSelected = activePreset?.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPricePreset(preset)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-50 border border-cyan-400 text-cyan-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <span className="truncate">{preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-700 flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={(e) => { handleApplyCustomPrice(e); setIsMobileFilterOpen(false); }} className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">Kustom Min &amp; Max (Rp):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={inputMin}
                      onChange={(e) => setInputMin(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-cyan-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={inputMax}
                      onChange={(e) => setInputMax(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Terapkan Rentang Harga
                  </button>
                </form>
              </div>

              {/* Categories Filter (Mobile) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Kategori
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => { setSelectedCategory(''); setSelectedSubcategory(''); setPage(1); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium ${selectedCategory === '' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-600'}`}
                  >
                    Semua Kategori
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCategory(c.slug); setSelectedSubcategory(''); setPage(1); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${selectedCategory === c.slug ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-600'}`}
                    >
                      <span>{c.name}</span>
                      {selectedCategory === c.slug && <Check className="w-3.5 h-3.5 text-cyan-700" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands Filter (Mobile) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Brand Maritim
                </span>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  <button
                    onClick={() => { setSelectedBrand(''); setPage(1); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium ${selectedBrand === '' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-600'}`}
                  >
                    Semua Brand
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { setSelectedBrand(b.slug); setPage(1); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${selectedBrand === b.slug ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-600'}`}
                    >
                      <span>{b.name}</span>
                      {selectedBrand === b.slug && <Check className="w-3.5 h-3.5 text-cyan-700" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Footer Action */}
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => { handleResetFilters(); setIsMobileFilterOpen(false); }}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Lihat Hasil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
