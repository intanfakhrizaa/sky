import React, { useState, useEffect } from 'react';
import { Package, ArrowRight, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Order } from '../types/index.ts';

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

  const filtered = orders.filter((o) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return o.payment_status === 'PENDING';
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
            Pantau status verifikasi pembayaran, proses gudang, dan pelacakan kurir ekspedisi
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { key: 'ALL', label: 'Semua Pesanan' },
          { key: 'PENDING', label: 'Menunggu Bayar' },
          { key: 'PROCESSING', label: 'Diproses' },
          { key: 'SHIPPED', label: 'Dikirim' },
          { key: 'COMPLETED', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
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
            className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
          >
            Buka Katalog Produk
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ord) => (
            <div
              key={ord.id}
              onClick={() => onSelectOrder(ord.order_number)}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">
                    #{ord.order_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ord.payment_status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ord.payment_status === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-cyan-100 text-cyan-800'
                    }`}
                  >
                    {ord.payment_status}
                  </span>
                  <span className="text-[11px] text-slate-400">• {ord.created_at}</span>
                </div>
                <p className="text-xs text-slate-600">
                  Penerima: <strong className="text-slate-800">{ord.recipient_name}</strong> • Kurir: {ord.shipping_method}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 block">Total Tagihan:</span>
                  <span className="text-base font-black text-slate-900">
                    Rp {ord.grand_total.toLocaleString('id-ID')}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
