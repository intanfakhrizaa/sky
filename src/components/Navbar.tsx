import React, { useState } from 'react';
import { 
  Compass, Search, Camera, Heart, ShoppingBag, User, 
  Menu, X, Shield, Sparkles, ChevronDown, LogOut, Package, 
  SlidersHorizontal, Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';

interface NavbarProps {
  onSearch: (query: string) => void;
  onOpenVisualSearch: () => void;
  onNavigate: (view: string, param?: string) => void;
  currentView: string;
}

export function Navbar({ onSearch, onOpenVisualSearch, onNavigate, currentView }: NavbarProps) {
  const { user, logout, login } = useAuth();
  const { summary, wishlistCount } = useCart();
  const { isConnected } = useRealtime();

  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleQuickAdminLogin = async () => {
    await login('admin@skyra.marine', 'admin123');
    setIsUserMenuOpen(false);
    onNavigate('admin');
  };

  const handleQuickCustomerLogin = async () => {
    await login('customer@skyra.marine', 'customer123');
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 shadow-md">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-sky-950 via-cyan-950 to-blue-950 text-cyan-200 text-xs py-1.5 px-4 border-b border-cyan-900/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              PROMO SAMUDERA:
            </span>
            <span className="hidden sm:inline">Gunakan kupon <strong className="text-white">OCEAN10</strong> untuk diskon 10% &amp; <strong className="text-white">FREESHIP</strong> gratis ongkir!</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {/* Realtime Live Pulse Indicator */}
            <div className="flex items-center gap-1.5" title={isConnected ? 'Database Realtime Aktif' : 'Menghubungkan Database'}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 hidden md:inline">
                {isConnected ? 'Realtime Sync: Aktif' : 'Reconnecting...'}
              </span>
            </div>

            {/* Quick Demo Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full text-slate-200">
              <span className="text-slate-400">Demo Role:</span>
              {user?.role === 'admin' ? (
                <button 
                  onClick={handleQuickCustomerLogin}
                  className="font-bold text-amber-300 hover:text-white transition-colors"
                >
                  Beralih ke Customer
                </button>
              ) : (
                <button 
                  onClick={handleQuickAdminLogin}
                  className="font-bold text-cyan-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3 h-3 text-cyan-400" />
                  Masuk sbg Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 text-slate-950 animate-spin-slow" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              SKYRA
              <span className="text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-semibold tracking-normal">
                MARINE
              </span>
            </span>
            <p className="text-[10px] text-cyan-300 font-medium tracking-wider uppercase -mt-0.5">
              Watersports &amp; Ocean Gear
            </p>
          </div>
        </div>

        {/* Global Search Bar & Visual Search */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="flex-1 max-w-2xl relative hidden md:flex items-center"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari surfboard, diving mask, wetsuit, life jacket, swimwear..."
              className="w-full pl-11 pr-24 py-2.5 bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700 focus:border-cyan-400 text-white placeholder-slate-400 rounded-full text-sm outline-none transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            
            {/* Visual Search Button in Search Bar */}
            <button
              type="button"
              onClick={onOpenVisualSearch}
              title="Cari berdasarkan Foto / Visual Search AI"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-full transition-colors shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto</span>
            </button>
          </div>
        </form>

        {/* Action Buttons: Wishlist, Cart, User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Visual Search Icon */}
          <button
            onClick={onOpenVisualSearch}
            className="md:hidden p-2 text-cyan-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Visual Search"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Wishlist */}
          <button
            onClick={() => onNavigate('wishlist')}
            className="relative p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Wishlist Favorit"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={() => onNavigate('cart')}
            className="relative p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
            title="Keranjang Belanja"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              {summary.selectedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 text-slate-950 text-[11px] font-extrabold rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                  {summary.selectedCount}
                </span>
              )}
            </div>
            {summary.subtotal > 0 && (
              <span className="hidden xl:inline text-xs font-bold text-cyan-300">
                Rp {summary.subtotal.toLocaleString('id-ID')}
              </span>
            )}
          </button>

          {/* User Account / Admin Switch */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-colors"
            >
              {user ? (
                <>
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover border border-cyan-400"
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-semibold text-white leading-none line-clamp-1">{user.name}</p>
                    <span className="text-[10px] text-cyan-400 capitalize">{user.role}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Masuk</span>
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-slate-200">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-slate-700/80">
                      <p className="font-bold text-white text-sm">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        Role: {user.role}
                      </span>
                    </div>

                    {(user.role === 'admin' || user.role === 'staff' || user.role === 'superadmin') && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-700/80 text-sm font-bold text-cyan-300 flex items-center gap-2 border-b border-slate-700/80"
                      >
                        <Shield className="w-4 h-4 text-cyan-400" />
                        Admin Dashboard &amp; Panel
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('orders');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 text-xs flex items-center gap-2 text-slate-300"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      Pesanan Saya
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 text-xs flex items-center gap-2 text-slate-300"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Pengaturan Profil &amp; Alamat
                    </button>

                    <div className="border-t border-slate-700 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-950/40 text-xs text-rose-400 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar (Logout)
                    </button>
                  </>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-slate-400 px-1">Masuk untuk belanja, cek grosir, dan riwayat pesanan:</p>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('login');
                      }}
                      className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                    >
                      Login Akun Customer
                    </button>
                    <button
                      onClick={handleQuickAdminLogin}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      Login sbg Admin (Demo)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <nav className="bg-slate-950 border-t border-slate-800/80 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 py-2 text-xs font-semibold whitespace-nowrap">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentView === 'home' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Beranda
          </button>
          
          <button
            onClick={() => onNavigate('catalog', 'surfing')}
            className="px-3 py-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Surfing
          </button>

          <button
            onClick={() => onNavigate('catalog', 'swimming')}
            className="px-3 py-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Swimming
          </button>

          <button
            onClick={() => onNavigate('catalog', 'diving')}
            className="px-3 py-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Diving &amp; Snorkeling
          </button>

          <button
            onClick={() => onNavigate('catalog', 'watersports')}
            className="px-3 py-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Watersports &amp; SUP
          </button>

          <button
            onClick={() => onNavigate('catalog', 'beach')}
            className="px-3 py-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Beach &amp; Coast
          </button>

          <button
            onClick={() => onNavigate('catalog', 'marine')}
            className="px-3 py-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Marine &amp; Laut
          </button>

          <button
            onClick={() => onNavigate('catalog', 'apparel')}
            className="px-3 py-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Apparel &amp; Rashguard
          </button>

          <button
            onClick={() => onNavigate('catalog', 'flash-sale')}
            className="px-3 py-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg transition-colors font-extrabold flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Flash Sale
          </button>

          <button
            onClick={() => onNavigate('catalog')}
            className="ml-auto px-3 py-1.5 text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 font-bold"
          >
            Semua Produk &rarr;
          </button>
        </div>
      </nav>
    </header>
  );
}
