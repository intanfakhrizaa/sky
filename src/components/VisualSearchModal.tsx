import React, { useState } from 'react';
import { Camera, Upload, Sparkles, X, Loader2, ArrowRight } from 'lucide-react';
import { Product } from '../types/index.ts';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productSlug: string) => void;
}

const SAMPLE_IMAGES = [
  {
    name: 'Diving Mask Frameless',
    category: 'Diving',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500'
  },
  {
    name: 'Carbon Surfboard Shortboard',
    category: 'Surfing',
    url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=500'
  },
  {
    name: 'Offshore Life Jacket Vest',
    category: 'Watersports',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500'
  },
  {
    name: 'Racing Swim Goggles',
    category: 'Swimming',
    url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=500'
  }
];

export function VisualSearchModal({ isOpen, onClose, onSelectProduct }: VisualSearchModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<{
    category: string;
    keywords: string[];
    matchedProducts: Product[];
    aiAnalysis?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      triggerSearch(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = async (sampleUrl: string) => {
    setSelectedImage(sampleUrl);
    setIsScanning(true);
    setError(null);
    setResults(null);

    try {
      // Convert sample image URL to base64
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        triggerSearch(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch {
      triggerSearch(sampleUrl);
    }
  };

  const triggerSearch = async (imageBase64: string) => {
    setIsScanning(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/products/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses gambar');
      }
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses visual search');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-900 to-cyan-800 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Camera className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-1.5">
                Visual Search SKYRA AI
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-cyan-400 text-slate-900 rounded-full">
                  Vision Engine
                </span>
              </h3>
              <p className="text-xs text-cyan-100">Cari perlengkapan laut, selancar & renang dari foto Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Dropzone */}
          <div className="relative">
            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-cyan-300 rounded-xl cursor-pointer bg-cyan-50/40 hover:bg-cyan-50 transition-colors group">
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <div className="p-3 bg-cyan-100 text-cyan-700 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Klik untuk unggah foto atau seret ke sini
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format PNG, JPG, WEBP (foto masker diving, surfboard, baju renang, dll.)
                </p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {/* Sample Images to Try */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Atau coba contoh gambar perlengkapan laut:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample.url)}
                  className="flex flex-col text-left p-1.5 rounded-lg border border-slate-200 hover:border-cyan-500 hover:shadow-sm transition-all group bg-slate-50"
                >
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-20 object-cover rounded-md mb-1.5"
                  />
                  <span className="text-[11px] font-medium text-slate-700 line-clamp-1 group-hover:text-cyan-700">
                    {sample.name}
                  </span>
                  <span className="text-[9px] text-cyan-600 font-semibold">{sample.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scanning Animation State */}
          {isScanning && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-cyan-600 animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">Menganalisis karakteristik visual produk...</p>
                <p className="text-xs text-slate-500">Mencocokkan bentuk, material, dan spesifikasi di database SKYRA</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Results Display */}
          {results && !isScanning && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    Hasil Pencocokan Visual:
                    <span className="text-cyan-700 font-semibold">{results.category}</span>
                  </h4>
                  {results.aiAnalysis && (
                    <p className="text-xs text-slate-500 italic mt-0.5">{results.aiAnalysis}</p>
                  )}
                </div>
                {results.keywords && results.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {results.keywords.slice(0, 4).map((kw, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full font-medium">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {results.matchedProducts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Tidak ditemukan produk yang serupa di katalog saat ini.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {results.matchedProducts.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProduct(p.slug);
                        onClose();
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/30 transition-all cursor-pointer group"
                    >
                      <img
                        src={p.primary_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200'}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-cyan-700 font-semibold uppercase">{p.brand_name || 'SKYRA'}</span>
                        <h5 className="text-xs font-semibold text-slate-900 truncate group-hover:text-cyan-800">
                          {p.name}
                        </h5>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          Rp {(p.promo_price || p.normal_price).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all mr-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
