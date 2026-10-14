import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Phone, Mail, Plus, Check, Shield, Heart, Package, 
  ArrowRight, Award, Sparkles, Clock, Truck, CreditCard, Navigation, 
  ChevronRight, LogIn, LogOut, FileSignature, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Address, Order } from '../types/index.ts';
import { formatFullDateTime, formatShortDateTime, formatElapsedDuration } from '../utils/dateUtils.ts';
import { MarineStoresMap } from '../components/MarineStoresMap.tsx';

interface ProfileViewProps {
  onNavigate?: (view: string) => void;
  onSelectOrder?: (orderNumber: string) => void;
}

export function ProfileView({ onNavigate, onSelectOrder }: ProfileViewProps) {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'transactions' | 'loyalty' | 'maps'>('profile');

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Transactions State
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);

  // Loyalty & Member State
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [isRegisteringMember, setIsRegisteringMember] = useState(false);
  const [memberMessage, setMemberMessage] = useState<string | null>(null);

  // Maps & Stores State
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('skyra-canggu');

  const token = localStorage.getItem('skyra_token');
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const loadAddresses = () => {
    if (!token) return;
    fetch('/api/auth/addresses', { headers: authHeaders })
      .then((res) => res.json())
      .then((d) => setAddresses(d.addresses || []));
  };

  const loadTransactions = () => {
    if (!token) return;
    setIsTransactionsLoading(true);
    fetch('/api/auth/transactions', { headers: authHeaders })
      .then((res) => res.json())
      .then((d) => setTransactions(d.transactions || []))
      .finally(() => setIsTransactionsLoading(false));
  };

  const loadLoyalty = () => {
    if (!token) return;
    fetch('/api/auth/loyalty', { headers: authHeaders })
      .then((res) => res.json())
      .then(setLoyaltyData);
  };

  const loadStores = () => {
    fetch('/api/auth/stores')
      .then((res) => res.json())
      .then((d) => setStores(d.stores || []));
  };

  useEffect(() => {
    loadAddresses();
    loadLoyalty();
    loadStores();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'transactions') loadTransactions();
    if (activeTab === 'loyalty') loadLoyalty();
    if (activeTab === 'maps') loadStores();
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setProfileMsg(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name, phone })
      });
      if (res.ok) {
        setProfileMsg('Profil berhasil diperbarui!');
        refreshUser();
      }
    } catch {
      setProfileMsg('Gagal memperbarui profil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          recipient_name: recipientName,
          phone: recipientPhone,
          street_address: streetAddress,
          city,
          province,
          postal_code: postalCode,
          is_default: addresses.length === 0 ? 1 : 0
        })
      });
      if (res.ok) {
        setShowAddAddress(false);
        setRecipientName('');
        setStreetAddress('');
        loadAddresses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterMember = async () => {
    setIsRegisteringMember(true);
    setMemberMessage(null);
    try {
      const res = await fetch('/api/auth/member/register', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setMemberMessage(data.message || 'Pendaftaran Member VIP Berhasil!');
        refreshUser();
        loadLoyalty();
      } else {
        setMemberMessage(data.error || 'Gagal mendaftar member');
      }
    } catch {
      setMemberMessage('Kesalahan jaringan');
    } finally {
      setIsRegisteringMember(false);
    }
  };

  // Find active shipped order to track on map
  const activeShippedOrder = transactions.find((t) => t.order_status === 'SHIPPED') || transactions[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Akun Saya &amp; Pusat Layanan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola profil, riwayat transaksi lengkap dengan jam masuk/keluar, poin reward loyalitas, dan pelacakan posisi barang di peta
          </p>
        </div>

        {/* Member badge chip */}
        <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-amber-500/10 to-amber-600/20 border border-amber-300 rounded-2xl">
          <Award className="w-5 h-5 text-amber-600" />
          <div className="text-left text-xs">
            <span className="text-[10px] uppercase font-black text-amber-900 block leading-tight">
              {user?.member_number ? `VIP ${user.membership_tier?.toUpperCase()}` : 'Member Reguler'}
            </span>
            <span className="font-bold text-slate-900">
              {user?.loyalty_points || 0} Poin Reward
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold border-b border-slate-200">
        {[
          { key: 'profile', label: 'Profil & Buku Alamat', icon: User },
          { key: 'transactions', label: `Riwayat Transaksi (${transactions.length || '•'})`, icon: Clock },
          { key: 'loyalty', label: 'Poin Loyalitas & Diskon Member', icon: Award },
          { key: 'maps', label: 'Lacak Lokasi Barang & Peta Gerai', icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFIL & BUKU ALAMAT */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Profile Form */}
          <div className="md:col-span-5 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{user?.name}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                    {user?.role}
                  </span>
                  {user?.member_number && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {user.member_number}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {profileMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
              >
                {isUpdating ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </form>

            {onNavigate && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akses Cepat:</p>
                <button
                  type="button"
                  onClick={() => onNavigate('wishlist')}
                  className="w-full p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 text-xs font-bold flex items-center justify-between transition-colors border border-rose-200"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600 fill-current" />
                    <span>Wishlist Favorit Saya</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-500" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('orders')}
                  className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-600" />
                    <span>Pesanan &amp; Antrian Menunggu</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            )}
          </div>

          {/* Address Book */}
          <div className="md:col-span-7 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Buku Alamat Pengiriman Tersimpan</h3>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Alamat</span>
              </button>
            </div>

            {showAddAddress && (
              <form onSubmit={handleCreateAddress} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-800">Form Alamat Baru</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nama Penerima"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Nomor Telepon"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Alamat Lengkap / Dermaga / Villa..."
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Kota / Kab"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Provinsi"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Kode Pos"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl"
                >
                  Simpan Alamat
                </button>
              </form>
            )}

            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{addr.recipient_name} ({addr.phone})</span>
                    {addr.is_default === 1 && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">{addr.street_address}</p>
                  <p className="text-slate-400">{addr.city}, {addr.province} {addr.postal_code}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT TRANSAKSI & WAKTU MASUK / KELUAR */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-blue-950 text-xs sm:text-sm">
                  Pencatatan Waktu Transaksi Akurat (WIB)
                </h3>
                <p className="text-[11px] text-blue-700">
                  Setiap transaksi tercatat jam masuk, jam bayar, jam keluar dari gudang (dispatch), dan status tanda tangan dokumen.
                </p>
              </div>
            </div>
          </div>

          {isTransactionsLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">Memuat riwayat transaksi...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Belum ada transaksi</h4>
              <p className="text-xs text-slate-500">Mulai belanja perlengkapan laut Anda sekarang.</p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('catalog')}
                  className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Buka Katalog Produk
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tr: any) => {
                const incomingTime = tr.incoming_at || tr.created_at;
                const outgoingTime = tr.shipped_at;
                const paidTime = tr.paid_at;

                return (
                  <div
                    key={tr.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          #{tr.order_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tr.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {tr.payment_status}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {tr.order_status}
                        </span>
                        {tr.signature_status === 'SIGNED' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Tanda Tangan Lengkap
                          </span>
                        ) : tr.signature_status === 'SIGN_LATER' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Sign Later (Tanda Tangan Nanti)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-medium flex items-center gap-1">
                            <FileSignature className="w-3 h-3" /> Belum TTD / Sign Later
                          </span>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Total Transaksi:</span>
                        <span className="text-base font-black text-slate-900">
                          Rp {tr.grand_total.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Timestamp Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                          <LogIn className="w-3 h-3 text-blue-500" /> Jam Transaksi Masuk
                        </span>
                        <span className="font-mono font-bold text-slate-900 block mt-0.5">
                          {formatFullDateTime(incomingTime)}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-emerald-500" /> Jam Pembayaran
                        </span>
                        <span className="font-mono font-bold text-slate-900 block mt-0.5">
                          {paidTime ? formatFullDateTime(paidTime) : 'Menunggu Konfirmasi'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                          <LogOut className="w-3 h-3 text-emerald-600" /> Jam Keluar Gudang
                        </span>
                        <span className="font-mono font-bold text-emerald-900 block mt-0.5">
                          {outgoingTime ? formatFullDateTime(outgoingTime) : 'Dalam Antrian Gudang'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-slate-500 text-[11px]">
                        Penerima: <strong>{tr.recipient_name}</strong> • Kurir: {tr.shipping_method}
                      </span>
                      {onSelectOrder && (
                        <button
                          onClick={() => onSelectOrder(tr.order_number)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                        >
                          <span>Buka Detail &amp; Lacak Waktu</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LOYALTY POINTS & MEMBER VIP REGISTRATION */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          {/* VIP Member Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 text-white shadow-xl space-y-6 relative overflow-hidden border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> SKYRA Marine Ocean Club Member
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {user?.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {user?.member_number || 'Belum Terdaftar Member VIP'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo Poin Anda:</span>
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {(loyaltyData?.points || user?.loyalty_points || 0).toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-slate-300 block">Poin Reward</span>
              </div>
            </div>

            {/* Member Perks & Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] text-cyan-300 font-bold uppercase block">Tingkat Tier:</span>
                <strong className="text-sm font-black text-white capitalize">
                  Tier {loyaltyData?.tier || user?.membership_tier || 'Standard'}
                </strong>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {loyaltyData?.pointsNeeded > 0 ? `+${loyaltyData.pointsNeeded} poin ke ${loyaltyData.nextTier}` : 'Tingkat Maksimal'}
                </p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] text-emerald-300 font-bold uppercase block">Diskon Member:</span>
                <strong className="text-sm font-black text-white">
                  {loyaltyData?.discountPercent || user?.member_discount_percent || 5}% Off
                </strong>
                <p className="text-[10px] text-slate-400 mt-0.5">Otomatis terpotong di keranjang</p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] text-amber-300 font-bold uppercase block">Waktu Pendaftaran:</span>
                <strong className="text-xs font-mono text-white block">
                  {user?.member_joined_at ? formatShortDateTime(user.member_joined_at) : 'Daftar sekarang gratis'}
                </strong>
                <p className="text-[10px] text-slate-400 mt-0.5">Reward seumur hidup</p>
              </div>
            </div>

            {/* Registration Banner if not a member yet */}
            {!user?.member_number && (
              <div className="p-4 bg-amber-500/20 border border-amber-400/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-black text-amber-300 text-sm">
                    Daftar Member VIP SKYRA Sekarang (Dapatkan Diskon 5% + Bonus 250 Poin)
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Aktivasi instan kartu VIP untuk mendapatkan diskon setiap belanja dan poin reward pada transaksi Anda.
                  </p>
                </div>
                <button
                  onClick={handleRegisterMember}
                  disabled={isRegisteringMember}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex-shrink-0 disabled:opacity-50"
                >
                  {isRegisteringMember ? 'Mengaktifkan...' : 'Aktivasi Member Sekarang (Gratis)'}
                </button>
              </div>
            )}

            {memberMessage && (
              <div className="p-3 bg-cyan-900/80 border border-cyan-400/50 rounded-xl text-xs text-cyan-200">
                {memberMessage}
              </div>
            )}
          </div>

          {/* Points Transaction History */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Riwayat Transaksi Mutasi Poin Reward (Lengkap dengan Jam)</span>
            </h3>

            {loyaltyData?.history && loyaltyData.history.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {loyaltyData.history.map((lh: any) => (
                  <div key={lh.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="text-slate-900 font-bold block">{lh.description}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Jenis: {lh.action_type} • Saldo Akhir: {lh.balance_after} poin
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        +{lh.points} Poin
                      </span>
                      <span className="font-mono text-slate-500 text-[11px] bg-slate-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        {formatFullDateTime(lh.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada mutasi poin reward. Lakukan pembelian untuk mengumpulkan poin reward!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: WHERE THE STUFF & MAPS */}
      {activeTab === 'maps' && (
        <div className="space-y-6">
          {/* Live Package Tracker Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-4 h-4" /> Live Tracking Status
                </span>
                <h3 className="font-black text-slate-900 text-base">
                  Dimana Barang Saya Sekarang? (Where's My Stuff?)
                </h3>
              </div>

              {activeShippedOrder && (
                <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono">
                  Pesanan Aktif: <strong>#{activeShippedOrder.order_number}</strong> ({activeShippedOrder.shipping_method})
                </div>
              )}
            </div>

            {/* Leaflet Map */}
            <MarineStoresMap
              stores={stores}
              selectedStoreId={selectedStoreId}
              onSelectStore={(st) => setSelectedStoreId(st.id)}
              shipmentTracker={
                activeShippedOrder
                  ? {
                      orderNumber: activeShippedOrder.order_number,
                      originCity: 'Gudang Logistik Pelabuhan Sanur',
                      destCity: activeShippedOrder.shipping_city,
                      currentLocation: 'Kurir dalam perjalanan menuju Jl. Pantai Batu Bolong, Canggu',
                      status: activeShippedOrder.order_status === 'SHIPPED' ? 'Sedang Diantar Kurir' : 'Dalam Persiapan Ekspedisi',
                      originCoords: [-8.6749, 115.2625], // Sanur port warehouse
                      destCoords: [-8.6595, 115.1301], // Canggu destination
                      currentCoords: [-8.6650, 115.1950], // Mid-route in transit
                    }
                  : undefined
              }
            />

            {/* Tracking Status Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Gudang Asal:</span>
                <strong className="text-slate-900">SKYRA Marine Hub Sanur</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">Keluar: {formatFullDateTime(activeShippedOrder?.shipped_at || new Date().toISOString())}</p>
              </div>

              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                <span className="text-[10px] text-cyan-800 uppercase font-bold block">Status Kurir Terkini:</span>
                <strong className="text-cyan-950">Dalam Pengantaran Kurir</strong>
                <p className="text-[10px] text-cyan-800 mt-0.5">Estimasi tiba hari ini</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tujuan Pengiriman:</span>
                <strong className="text-slate-900">{activeShippedOrder?.shipping_city || 'Canggu, Bali'}</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">Penerima: {activeShippedOrder?.recipient_name || user?.name}</p>
              </div>
            </div>
          </div>

          {/* Outlets & Marine Stations Directory */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-3">
              Daftar Gerai &amp; Lab Pelayaran SKYRA Marine di Indonesia
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {stores.map((st: any) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStoreId(st.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedStoreId === st.id
                      ? 'border-cyan-500 bg-cyan-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{st.name}</h4>
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold mt-1">
                        {st.type}
                      </span>
                    </div>
                    <span className="text-cyan-700 font-bold text-[11px]">{st.city}</span>
                  </div>

                  <p className="text-slate-600 text-[11px] mt-2">{st.address}</p>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                    <span>🕒 {st.hours}</span>
                    <span>📞 {st.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
