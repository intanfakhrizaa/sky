import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Truck, CreditCard, QrCode, Tag, 
  ArrowLeft, Check, AlertCircle, Loader2, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface CheckoutViewProps {
  onBack: () => void;
  onOrderSuccess: (orderNumber: string) => void;
}

export function CheckoutView({ onBack, onOrderSuccess }: CheckoutViewProps) {
  const { user } = useAuth();
  const { summary, refreshCart } = useCart();

  // Address fields
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('Jl. Pantai Batu Bolong No. 88, Canggu');
  const [shippingCity, setShippingCity] = useState('Badung');
  const [shippingProvince, setShippingProvince] = useState('Bali');
  const [shippingPostal, setShippingPostal] = useState('80361');

  // Shipping methods
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);

  // Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [notes, setNotes] = useState('');

  // Submit status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/checkout/shipping-methods')
      .then((res) => res.json())
      .then((data) => {
        setShippingMethods(data.methods || []);
        if (data.methods && data.methods.length > 0) {
          setSelectedShipping(data.methods[0]);
        }
      });
  }, []);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsValidatingVoucher(true);
    setVoucherError(null);

    try {
      const res = await fetch('/api/checkout/validate-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim(), subtotal: summary.subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVoucherError(data.error || 'Kupon tidak valid');
        setAppliedVoucher(null);
      } else {
        setAppliedVoucher(data);
        setVoucherError(null);
      }
    } catch {
      setVoucherError('Gagal memvalidasi kupon');
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const voucherDiscount = appliedVoucher?.discount || 0;
  const shippingCost = selectedShipping?.cost || 0;
  const grandTotal = Math.max(0, summary.subtotal - voucherDiscount + shippingCost);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientPhone || !shippingAddress || !shippingCity) {
      setErrorMessage('Harap lengkapi semua kolom alamat pengiriman.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('skyra_token');
      const sessionId = localStorage.getItem('skyra_session_id') || 'guest_default_session';

      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_province: shippingProvince,
          shipping_postal: shippingPostal,
          shipping_method_id: selectedShipping?.id,
          payment_method: paymentMethod,
          voucher_code: appliedVoucher?.code || null,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat pesanan');
      }

      await refreshCart();
      onOrderSuccess(data.orderNumber);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout Pembelian</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lengkapi alamat dan pilih metode pembayaran untuk mengamankan pesanan Anda
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Keranjang</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 text-rose-800 text-xs rounded-2xl border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Checkout Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Alamat Pengiriman */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-700 text-white text-xs flex items-center justify-center">
                1
              </span>
              Alamat Pengiriman (Pulau / Pesisir / Kota)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Penerima</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+62 8..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap / Dermaga / Hotel</label>
                <textarea
                  required
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Nama Jalan, Nomor, Nama Resort, Patokan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kota / Kabupaten</label>
                <input
                  type="text"
                  required
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="Cth: Badung, Denpasar, Lombok"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Provinsi &amp; Kode Pos</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={shippingProvince}
                    onChange={(e) => setShippingProvince(e.target.value)}
                    placeholder="Provinsi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    value={shippingPostal}
                    onChange={(e) => setShippingPostal(e.target.value)}
                    placeholder="Kode Pos"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Ekspedisi Pengiriman */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-700 text-white text-xs flex items-center justify-center">
                2
              </span>
              Metode Ekspedisi Maritim
            </h3>

            <div className="space-y-2">
              {shippingMethods.map((m) => {
                const isSelected = selectedShipping?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedShipping(m)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-50/50 ring-1 ring-cyan-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className={`w-4 h-4 ${isSelected ? 'text-cyan-600' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-bold text-slate-900">{m.name}</p>
                        <span className="text-[11px] text-slate-500">Asuransi kelautan termasuk</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      Rp {m.cost.toLocaleString('id-ID')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Metode Pembayaran */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-700 text-white text-xs flex items-center justify-center">
                3
              </span>
              Pilih Metode Pembayaran
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* QRIS */}
              <div
                onClick={() => setPaymentMethod('QRIS')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'QRIS'
                    ? 'border-cyan-600 bg-cyan-50/60 ring-1 ring-cyan-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-cyan-600" />
                    QRIS Instan
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                    Otomatis
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Scan QR pakai BCA Mobile, GoPay, OVO, ShopeePay, DANA, Livin.
                </p>
              </div>

              {/* Virtual Account BCA */}
              <div
                onClick={() => setPaymentMethod('VA_BCA')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'VA_BCA'
                    ? 'border-cyan-600 bg-cyan-50/60 ring-1 ring-cyan-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    BCA Virtual Account
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Nomor VA khusus terbit otomatis setelah checkout.
                </p>
              </div>

              {/* Transfer Bank Manual */}
              <div
                onClick={() => setPaymentMethod('BANK_TRANSFER_MANUAL')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all sm:col-span-2 ${
                  paymentMethod === 'BANK_TRANSFER_MANUAL'
                    ? 'border-cyan-600 bg-cyan-50/60 ring-1 ring-cyan-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-700" />
                    Transfer Bank Manual &amp; Upload Bukti Transfer
                  </span>
                  <span className="text-[10px] text-cyan-700 font-bold bg-cyan-100 px-2 py-0.5 rounded">
                    Verifikasi Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Transfer ke rekening Bank Mandiri / BCA resmi SKYRA Marine lalu upload foto struk untuk diverifikasi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review, Voucher & Grand Total */}
        <div className="lg:col-span-4 space-y-6">
          {/* Voucher Box */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-cyan-700" />
              Kupon Promo Samudera
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Cth: OCEAN10"
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold tracking-wider outline-none uppercase focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={isValidatingVoucher || !voucherCode.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isValidatingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Terapkan'}
              </button>
            </div>

            {appliedVoucher && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="font-bold">{appliedVoucher.code} Aktif!</p>
                  <p className="text-[10px] text-emerald-600">{appliedVoucher.description}</p>
                </div>
                <span className="font-bold text-sm">
                  -Rp {appliedVoucher.discount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {voucherError && (
              <p className="text-xs text-rose-600 font-medium">{voucherError}</p>
            )}

            <p className="text-[10px] text-slate-400">
              Kupon tersedia: <span className="font-bold text-cyan-700 cursor-pointer" onClick={() => setVoucherCode('OCEAN10')}>OCEAN10</span>, <span className="font-bold text-cyan-700 cursor-pointer" onClick={() => setVoucherCode('FREESHIP')}>FREESHIP</span>
            </p>
          </div>

          {/* Final Summary Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Rincian Pembayaran
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk</span>
                <span className="font-bold text-slate-900">
                  Rp {summary.subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Kupon</span>
                  <span>-Rp {voucherDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim ({selectedShipping?.name?.split(' ')[0]})</span>
                <span className="font-bold text-slate-900">
                  Rp {shippingCost.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Pembayaran:</span>
                <span className="text-2xl font-black text-slate-900">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunci Stok &amp; Memproses...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Bayar Sekarang (Kunci Stok)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
