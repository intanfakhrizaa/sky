import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, QrCode, CreditCard, 
  Upload, Printer, ArrowLeft, Truck, Package, ShieldCheck, Loader2,
  LogIn, LogOut, Calendar, Timer, History, UserCheck
} from 'lucide-react';
import { Order } from '../types/index.ts';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { formatFullDateTime, formatShortDateTime, formatElapsedDuration } from '../utils/dateUtils.ts';

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
        setUploadMessage('Bukti pembayaran berhasil diunggah! Waktu pengunggahan dicatat dan admin sedang memverifikasi.');
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
        <p className="text-xs text-slate-500 font-medium">Memuat data pesanan dan rincian waktu...</p>
      </div>
    );
  }

  const incomingTime = order.incoming_at || order.created_at;
  const paidTime = order.paid_at;
  const processedTime = order.processed_at;
  const shippedTime = order.shipped_at;
  const deliveredTime = order.delivered_at;

  const steps = [
    { 
      key: 'PENDING_PAYMENT', 
      label: 'Pesanan Masuk',
      subtext: formatShortDateTime(incomingTime),
      exactTime: incomingTime,
      icon: LogIn
    },
    { 
      key: 'PAYMENT_VERIFICATION', 
      label: 'Pembayaran',
      subtext: paidTime ? formatShortDateTime(paidTime) : order.paymentProof ? 'Struk ditinjau' : 'Menunggu bayar',
      exactTime: paidTime,
      icon: CreditCard
    },
    { 
      key: 'PROCESSING', 
      label: 'Diproses Gudang',
      subtext: processedTime ? formatShortDateTime(processedTime) : 'Antrian gudang',
      exactTime: processedTime,
      icon: Package
    },
    { 
      key: 'SHIPPED', 
      label: 'Pesanan Keluar (Kirim)',
      subtext: shippedTime ? formatShortDateTime(shippedTime) : 'Siap keluar',
      exactTime: shippedTime,
      icon: LogOut
    },
    { 
      key: 'COMPLETED', 
      label: 'Selesai / Tiba',
      subtext: deliveredTime ? formatShortDateTime(deliveredTime) : 'Menunggu tiba',
      exactTime: deliveredTime,
      icon: CheckCircle2
    },
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
            <span>Kembali ke Riwayat Pesanan</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              #{order.order_number}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                order.payment_status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : order.payment_status === 'UNDER_REVIEW'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
              }`}
            >
              {order.payment_status === 'PAID'
                ? 'Lunas'
                : order.payment_status === 'UNDER_REVIEW'
                ? 'Sedang Ditinjau'
                : 'Belum Dibayar'}
            </span>
            <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
              {order.order_status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Dibuat: <strong className="text-slate-800">{formatFullDateTime(incomingTime)}</strong></span>
            {shippedTime && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-bold">Keluar Gudang: {formatFullDateTime(shippedTime)}</span>
              </>
            )}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-sm"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Cetak Bukti Faktur (Invoice)</span>
        </button>
      </div>

      {/* Key Lifecycle Timestamps Cards (Waktu Masuk, Waktu Keluar, Waktu Selesai) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Waktu Masuk */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Waktu Pesanan Masuk
            </span>
            <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
              {formatFullDateTime(incomingTime)}
            </span>
            <span className="text-[11px] text-slate-500">
              Dicatat saat checkout dibuat
            </span>
          </div>
        </div>

        {/* Waktu Keluar / Dikirim */}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-start gap-3 ${
          shippedTime ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-2.5 rounded-xl ${
            shippedTime ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-black uppercase tracking-wider block ${
                shippedTime ? 'text-emerald-800' : 'text-slate-400'
              }`}>
                Waktu Pesanan Keluar
              </span>
              {shippedTime && (
                <span className="text-[9px] bg-emerald-200 text-emerald-950 font-black px-1.5 py-0.2 rounded">
                  DIKIRIM
                </span>
              )}
            </div>
            <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
              {shippedTime ? formatFullDateTime(shippedTime) : 'Belum Keluar dari Gudang'}
            </span>
            <span className="text-[11px] text-slate-500">
              {shippedTime ? `Kurir: ${order.shipping_method}` : 'Dalam antrian packing gudang'}
            </span>
          </div>
        </div>

        {/* Durasi & Waktu Selesai */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Total Durasi Proses
            </span>
            <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
              {formatElapsedDuration(incomingTime, deliveredTime || shippedTime)}
            </span>
            <span className="text-[11px] text-slate-500">
              {deliveredTime ? `Selesai: ${formatFullDateTime(deliveredTime)}` : 'Pesanan masih aktif'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Order Tracking Timeline */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pelacak Status Pesanan &amp; Linimasa Jam
          </h3>
          <span className="text-[11px] text-cyan-700 font-bold bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            Sinkronisasi Otomatis
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {steps.map((st, i) => {
            const status = getStepStatus(st.key);
            const Icon = st.icon;
            return (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border transition-all ${
                  status === 'completed'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${
                    status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <p className="text-xs font-bold leading-tight">{st.label}</p>
                <p className="text-[10px] font-mono mt-1 opacity-90 truncate">
                  {st.subtext}
                </p>
                {st.exactTime && (
                  <p className="text-[9px] font-mono text-emerald-800 font-bold mt-0.5">
                    {formatFullDateTime(st.exactTime).split(',')[1]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {order.tracking_number && (
          <div className="p-4 bg-sky-50 text-sky-950 rounded-2xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-600 text-white rounded-xl">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Nomor Resi Pelayaran &amp; Kurir:</p>
                <p className="font-mono text-sm font-black text-sky-950 mt-0.5">
                  {order.tracking_number}
                </p>
              </div>
            </div>
            {shippedTime && (
              <div className="sm:text-right text-xs">
                <span className="text-sky-700 block text-[10px] uppercase font-bold">Waktu Keluar Pengiriman:</span>
                <span className="font-mono font-bold text-sky-900">{formatFullDateTime(shippedTime)}</span>
              </div>
            )}
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
            <div className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold self-start flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Batas Waktu: 24 Jam sejak {formatShortDateTime(incomingTime)}</span>
            </div>
          </div>

          {/* QRIS Display */}
          {order.payment_method === 'QRIS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                    <QrCode className="w-4 h-4" /> Scan Kode QRIS Nasional
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Buka GoPay, OVO, Dana, BCA Mobile, Livin Mandiri atau aplikasi e-wallet lainnya.
                  </p>
                </div>
                <button
                  onClick={handleSimulatePayment}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Simulasi Bayar QRIS Instan (Demo Mode)</span>
                </button>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl text-slate-950 text-center shadow-lg">
                <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-xl mb-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      order.payment?.qr_code_data || 'SKYRA_QRIS_DEFAULT'
                    )}`}
                    alt="QRIS Code"
                    className="w-40 h-40"
                  />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400">NMID: ID102938472910</span>
                <span className="text-xs font-black text-slate-900 mt-0.5">SKYRA MARINE INDONESIA</span>
              </div>
            </div>
          )}

          {/* Manual Bank Transfer Form */}
          {order.payment_method === 'BANK_TRANSFER_MANUAL' && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
                <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Rekening Pembayaran Resmi SKYRA:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Bank Central Asia (BCA)</p>
                    <p className="font-mono text-base font-bold text-white">8830-1928-44</p>
                    <p className="text-slate-400 text-[10px]">a.n PT SKYRA MARINE INDONESIA</p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Bank Mandiri</p>
                    <p className="font-mono text-base font-bold text-white">137-00-9988-223</p>
                    <p className="text-slate-400 text-[10px]">a.n PT SKYRA MARINE INDONESIA</p>
                  </div>
                </div>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUploadProof} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-400">
                  Konfirmasi / Unggah Bukti Transfer
                </h4>

                {uploadMessage && (
                  <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-xs text-cyan-200">
                    {uploadMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Bank Anda (contoh: BCA)"
                    value={bankSender}
                    onChange={(e) => setBankSender(e.target.value)}
                    required
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    placeholder="Nama Pengirim Sesuai Rekening"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                  />
                  <input
                    type="number"
                    placeholder="Nominal Transfer"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="URL Bukti Foto Struk"
                    value={proofImage}
                    onChange={(e) => setProofImage(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Mengunggah...' : 'Kirim Bukti Bayar'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Audit Log & Timestamp History Table */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Riwayat Waktu &amp; Jejak Status Pesanan (Audit Timestamp Log)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pencatatan waktu akurat detik per detik saat pesanan masuk, diverifikasi, keluar gudang, hingga tiba
              </p>
            </div>
          </div>
        </div>

        {order.status_history && order.status_history.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {order.status_history.map((hist, idx) => (
              <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 p-2 rounded-xl transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${
                    hist.event_type === 'PESANAN_MASUK'
                      ? 'bg-blue-100 text-blue-800'
                      : hist.event_type === 'PESANAN_KELUAR'
                      ? 'bg-emerald-100 text-emerald-800'
                      : hist.event_type === 'PESANAN_SELESAI'
                      ? 'bg-purple-100 text-purple-800'
                      : hist.event_type === 'PEMBAYARAN_DITERIMA'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {hist.event_type === 'PESANAN_MASUK' ? (
                      <LogIn className="w-3.5 h-3.5" />
                    ) : hist.event_type === 'PESANAN_KELUAR' ? (
                      <LogOut className="w-3.5 h-3.5" />
                    ) : hist.event_type === 'PESANAN_SELESAI' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 font-bold">{hist.title}</strong>
                      <span className="px-2 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                        {hist.status}
                      </span>
                    </div>
                    {hist.description && (
                      <p className="text-slate-600 text-[11px] mt-0.5">{hist.description}</p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-0.5 block flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Pelaksana: {hist.actor || 'Sistem SKYRA'}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:self-center flex-shrink-0">
                  <span className="font-mono font-bold text-slate-800 text-[11px] block bg-slate-100 px-2.5 py-1 rounded-lg">
                    {formatFullDateTime(hist.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-400">
            Waktu masuk: {formatFullDateTime(incomingTime)}
          </div>
        )}
      </div>

      {/* Items & Shipping Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ordered Items List */}
        <div className="lg:col-span-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Item Produk dalam Pesanan
          </h3>

          <div className="space-y-3">
            {order.items?.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100"
              >
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
