import React, { useState, useEffect } from 'react';
import { 
  Package, ArrowRight, Clock, CheckCircle2, ChevronRight, 
  Truck, ArrowDownLeft, ArrowUpRight, LogIn, LogOut, Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Order } from '../types/index.ts';
import { formatFullDateTime, formatShortDateTime, formatElapsedDuration } from '../utils/dateUtils.ts';

interface OrdersListViewProps {
  onSelectOrder: (orderNumber: string) => void;
  onNavigate: (view: string) => void;
}

export function OrdersListView({ onSelectOrder, onNavigate }: OrdersListViewProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('skyra_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setIsLoading(false));
  }, [user]);

  const waitingCount = orders.filter(
    (o) => o.order_status === 'PAYMENT_VERIFICATION' || o.order_status === 'PENDING_PAYMENT' || o.payment_status === 'UNDER_REVIEW' || o.payment_status === 'PENDING'
  ).length;

  const filtered = orders.filter((o) => {
    if (filter === 'ALL') return true;
    if (filter === 'WAITING_LIST') {
      return o.order_status === 'PAYMENT_VERIFICATION' || o.order_status === 'PENDING_PAYMENT' || o.payment_status === 'UNDER_REVIEW' || o.payment_status === 'PENDING';
    }
    if (filter === 'PENDING') return o.payment_status === 'PENDING' && o.order_status !== 'PAYMENT_VERIFICATION';
    if (filter === 'PROCESSING') return o.order_status === 'PROCESSING' || o.order_status === 'PACKED';
    if (filter === 'SHIPPED') return o.order_status === 'SHIPPED';
    if (filter === 'COMPLETED') return o.order_status === 'COMPLETED';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pesanan Saya</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau jam pesanan masuk, jadwal verifikasi, waktu pesanan keluar/dikirim, hingga tiba di tujuan
          </p>
        </div>
      </div>

      {/* Waiting List Alert Banner if any pending transactions */}
      {waitingCount > 0 && filter !== 'WAITING_LIST' && (
        <div 
          onClick={() => setFilter('WAITING_LIST')}
          className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Ada {waitingCount} Transaksi dalam Antrian Menunggu (Waiting List)
              </h4>
              <p className="text-[11px] text-amber-700">
                Pesanan sedang menunggu pembayaran atau verifikasi struk oleh admin. Waktu masuk transaksi tercatat lengkap.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-900 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-300">
            Buka Daftar Tunggu &rarr;
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { key: 'ALL', label: 'Semua Pesanan' },
          { key: 'WAITING_LIST', label: `Daftar Tunggu Transaksi (${waitingCount})` },
          { key: 'PROCESSING', label: 'Diproses Gudang' },
          { key: 'SHIPPED', label: 'Pesanan Keluar / Dikirim' },
          { key: 'COMPLETED', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === tab.key
                ? tab.key === 'WAITING_LIST' 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
                  : 'bg-cyan-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.key === 'WAITING_LIST' && <Clock className="w-3.5 h-3.5" />}
            {tab.key === 'SHIPPED' && <Truck className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Memuat riwayat pesanan...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Belum ada pesanan pada status ini</h3>
          <p className="text-xs text-slate-500">Mulai belanja kebutuhan surfing dan laut Anda sekarang!</p>
          <button
            onClick={() => onNavigate('catalog')}
            className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
          >
            Buka Katalog Produk
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ord) => {
            const incomingTime = ord.incoming_at || ord.created_at;
            const outgoingTime = ord.shipped_at;
            const paidTime = ord.paid_at;
            const deliveredTime = ord.delivered_at;

            return (
              <div
                key={ord.id}
                onClick={() => onSelectOrder(ord.order_number)}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer space-y-3.5"
              >
                {/* Header row: Order number, badges, and Grand total */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm tracking-tight">
                      #{ord.order_number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ord.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : ord.payment_status === 'UNDER_REVIEW'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                      }`}
                    >
                      {ord.payment_status === 'PAID'
                        ? 'LUNAS'
                        : ord.payment_status === 'UNDER_REVIEW'
                        ? 'MENUNGGU VERIFIKASI'
                        : 'MENUNGGU BAYAR'}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                      {ord.order_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Total Tagihan:</span>
                      <span className="text-base font-black text-slate-900">
                        Rp {ord.grand_total.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {/* Recipient & Courier */}
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    Penerima: <strong className="text-slate-900">{ord.recipient_name}</strong> ({ord.shipping_city})
                  </span>
                  <span>•</span>
                  <span>
                    Ekspedisi: <strong className="text-slate-800">{ord.shipping_method}</strong>
                  </span>
                  {ord.tracking_number && (
                    <>
                      <span>•</span>
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Resi: {ord.tracking_number}
                      </span>
                    </>
                  )}
                </div>

                {/* Timestamp Matrix (Waktu Masuk & Waktu Keluar) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  {/* Jam Masuk */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                      <LogIn className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Jam Pesanan Masuk
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        {formatFullDateTime(incomingTime)}
                      </span>
                    </div>
                  </div>

                  {/* Jam Keluar / Outgoing Dispatch */}
                  {outgoingTime ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                            Jam Pesanan Keluar (Dikirim)
                          </span>
                          <span className="text-[9px] bg-emerald-200 text-emerald-950 font-bold px-1.5 py-0.2 rounded">
                            Diserahkan ke Kurir
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-950 text-[11px]">
                          {formatFullDateTime(outgoingTime)}
                        </span>
                      </div>
                    </div>
                  ) : deliveredTime ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                      <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                          Jam Pesanan Selesai / Tiba
                        </span>
                        <span className="font-mono font-bold text-purple-950 text-[11px]">
                          {formatFullDateTime(deliveredTime)}
                        </span>
                      </div>
                    </div>
                  ) : ord.order_status === 'PROCESSING' || ord.order_status === 'PACKED' ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-50 border border-cyan-200">
                      <div className="p-1.5 bg-cyan-600 text-white rounded-lg">
                        <Timer className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider block">
                          Jam Diproses Gudang
                        </span>
                        <span className="font-mono font-bold text-cyan-950 text-[11px]">
                          {formatFullDateTime(ord.processed_at || paidTime || incomingTime)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          Estimasi Jadwal Keluar Gudang
                        </span>
                        <span className="text-[11px] font-medium text-amber-900">
                          Siap keluar segera setelah pembayaran lunas diverifikasi
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
