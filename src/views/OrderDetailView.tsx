import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, QrCode, CreditCard, 
  Upload, Printer, ArrowLeft, Truck, Package, ShieldCheck, Loader2 
} from 'lucide-react';
import { Order } from '../types/index.ts';
import { useRealtime } from '../context/RealtimeContext.tsx';

interface OrderDetailViewProps {
  orderNumber: string;
  onBack: () => void;
}

export function OrderDetailView({ orderNumber, onBack }: OrderDetailViewProps) {
  const { lastEvent } = useRealtime();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Manual payment proof upload fields
  const [bankSender, setBankSender] = useState('');
  const [senderName, setSenderName] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [proofImage, setProofImage] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const fetchOrder = () => {
    setIsLoading(true);
    fetch(`/api/orders/${orderNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
          setTransferAmount(String(data.order.grand_total));
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  // Real-time synchronization for order status & payment changes!
  useEffect(() => {
    if (
      lastEvent &&
      (lastEvent.type === 'ORDER_STATUS_CHANGED' || lastEvent.type === 'PAYMENT_STATUS_CHANGED')
    ) {
      if (lastEvent.data?.orderNumber === orderNumber) {
        fetchOrder();
      }
    }
  }, [lastEvent, orderNumber]);

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankSender || !senderName || !proofImage) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderNumber}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: proofImage,
          bankSender,
          senderName,
          transferAmount: Number(transferAmount),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMessage('Bukti pembayaran berhasil diunggah! Admin sedang memverifikasi.');
        fetchOrder();
      } else {
        setUploadMessage(data.error || 'Gagal mengunggah bukti pembayaran');
      }
    } catch {
      setUploadMessage('Kesalahan jaringan');
    } finally {
      setIsUploading(false);
    }
  };

  // Simulate Instant QRIS Payment for testing
  const handleSimulatePayment = async () => {
    if (!order?.payment?.id) return;
    try {
      await fetch(`/api/admin/payments/${order.payment.id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('skyra_token') || 'user_1'}`,
        },
        body: JSON.stringify({ action: 'APPROVE', adminNotes: 'Simulasi bayar QRIS berhasil' }),
      });
      fetchOrder();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Memuat data pesanan...</p>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING_PAYMENT', label: 'Menunggu Pembayaran' },
    { key: 'PAYMENT_VERIFICATION', label: 'Verifikasi Pembayaran' },
    { key: 'PROCESSING', label: 'Diproses Gudang' },
    { key: 'SHIPPED', label: 'Dalam Pengiriman' },
    { key: 'COMPLETED', label: 'Selesai' },
  ];

  const getStepStatus = (stepKey: string) => {
    const current = order.order_status;
    const orderFlow = ['PENDING_PAYMENT', 'PAYMENT_VERIFICATION', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
    const currentIdx = orderFlow.indexOf(current);
    const targetIdx = orderFlow.indexOf(stepKey);

    if (current === 'CANCELLED') return 'cancelled';
    if (currentIdx >= targetIdx) return 'completed';
    return 'pending';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-cyan-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Pesanan #{order.order_number}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                order.payment_status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.payment_status === 'UNDER_REVIEW'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-cyan-100 text-cyan-800'
              }`}
            >
              {order.payment_status === 'PAID'
                ? 'Lunas'
                : order.payment_status === 'UNDER_REVIEW'
                ? 'Sedang Ditinjau'
                : 'Belum Dibayar'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Dibuat pada: {order.created_at}</p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Bukti Faktur</span>
        </button>
      </div>

      {/* Real-time Order Tracking Timeline */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Pelacak Status Pesanan (Sinkronisasi Real-Time)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {steps.map((st, i) => {
            const status = getStepStatus(st.key);
            return (
              <div
                key={i}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  status === 'completed'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <p className="text-xs leading-tight">{st.label}</p>
              </div>
            );
          })}
        </div>

        {order.tracking_number && (
          <div className="p-3.5 bg-sky-50 text-sky-900 rounded-2xl border border-sky-200 flex items-center gap-3 text-xs">
            <Truck className="w-5 h-5 text-sky-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Nomor Resi Pelayaran / Kurir:</p>
              <p className="font-mono text-sm font-black text-sky-950 mt-0.5">
                {order.tracking_number}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Action Box (If Pending) */}
      {order.payment_status !== 'PAID' && (
        <div className="p-6 bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Instruksi Pembayaran
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                Total Tagihan: Rp {order.grand_total.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold self-start">
              Selesaikan sebelum 24 Jam
            </div>
          </div>

          {/* QRIS Display */}
          {order.payment_method === 'QRIS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center p-6 bg-white rounded-2xl text-slate-900 text-center space-y-3">
                <div className="p-3 border-2 border-dashed border-slate-300 rounded-xl">
                  {/* SVG QR Code Simulation */}
                  <div className="w-44 h-44 bg-slate-900 flex items-center justify-center p-3 rounded-lg text-white">
                    <QrCode className="w-36 h-36 text-white" />
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-slate-900 block text-sm">QRIS RESMI SKYRA</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">NMID: ID1020038849204</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Cara Pembayaran QRIS:</h4>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Buka aplikasi BCA Mobile, GoPay, OVO, Livin, DANA, atau ShopeePay.</li>
                  <li>Pilih menu <strong>Scan QR / Bayar</strong>.</li>
                  <li>Scan kode QR di samping dan konfirmasi nominal Rp {order.grand_total.toLocaleString('id-ID')}.</li>
                  <li>Status pesanan akan berubah otomatis menjadi <strong>Lunas</strong> dalam 5 detik.</li>
                </ol>

                <div className="pt-2">
                  <button
                    onClick={handleSimulatePayment}
                    className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition-colors"
                  >
                    Simulasi Pembayaran QRIS Berhasil (Tes Cepat)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bank Transfer Manual & Upload Bukti */}
          {order.payment_method === 'BANK_TRANSFER_MANUAL' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs space-y-2">
                <p className="font-bold text-white text-sm">Rekening Resmi SKYRA Marine:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Bank Mandiri</span>
                    <strong className="text-sm font-mono text-cyan-300">137-00-9876543-2</strong>
                    <span className="text-slate-400 block text-[10px]">a.n. PT SKYRA SAMUDERA INDONESIA</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Bank BCA</span>
                    <strong className="text-sm font-mono text-cyan-300">828-0918-223</strong>
                    <span className="text-slate-400 block text-[10px]">a.n. PT SKYRA SAMUDERA INDONESIA</span>
                  </div>
                </div>
              </div>

              {/* Upload Proof Form */}
              <form onSubmit={handleUploadProof} className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Unggah Bukti Transfer Bank
                </h4>

                {uploadMessage && (
                  <div className="p-3 bg-cyan-950 text-cyan-200 text-xs rounded-xl border border-cyan-800">
                    {uploadMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Nama Bank Pengirim</label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: BCA / Mandiri / BNI"
                      value={bankSender}
                      onChange={(e) => setBankSender(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Nama Pemilik Rekening Pengirim</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama di buku tabungan/struk"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">URL Bukti / Gambar Struk</label>
                    <input
                      type="text"
                      required
                      value={proofImage}
                      onChange={(e) => setProofImage(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran ke Admin'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Order Items & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Daftar Barang Dipesan
          </h3>

          <div className="space-y-3">
            {order.items?.map((it) => (
              <div key={it.id} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
                <img
                  src={it.image_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200'}
                  alt=""
                  className="w-16 h-16 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate">{it.product_name}</h4>
                  <p className="text-[11px] text-slate-500">
                    Varian: {it.variant_title} • Qty: <strong>{it.quantity} unit</strong>
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">SKU: {it.sku}</p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-extrabold text-slate-900">
                    Rp {it.subtotal.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    @ Rp {it.unit_price.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment Summary */}
        <div className="lg:col-span-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Rincian Alamat &amp; Biaya
          </h3>

          <div className="text-xs space-y-2 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Penerima:</span>
              <p className="font-bold text-slate-800">{order.recipient_name} ({order.recipient_phone})</p>
              <p className="text-slate-600 mt-0.5">{order.shipping_address}, {order.shipping_city}, {order.shipping_province} {order.shipping_postal}</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Ekspedisi:</span>
              <p className="font-semibold text-slate-800">{order.shipping_method}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal Barang:</span>
                <span className="font-bold text-slate-800">Rp {order.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {order.wholesale_discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon Grosir:</span>
                  <span>-Rp {order.wholesale_discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {order.voucher_discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Voucher ({order.voucher_code}):</span>
                  <span>-Rp {order.voucher_discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Ongkir:</span>
                <span className="font-bold text-slate-800">Rp {order.shipping_cost.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Total:</span>
                <span className="text-lg">Rp {order.grand_total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
