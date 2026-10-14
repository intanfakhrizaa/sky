import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, Boxes, ShoppingCart, CreditCard, 
  Users, BarChart3, History, Plus, Search, Edit2, Trash2, 
  Check, X, AlertTriangle, ArrowUpDown, Download, Printer, Shield, Eye, Clock,
  Truck, LogIn, LogOut, Timer, Calendar, UserCheck
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { formatFullDateTime, formatShortDateTime, formatElapsedDuration } from '../utils/dateUtils.ts';

interface AdminViewProps {
  onBackToStore: () => void;
}

export function AdminView({ onBackToStore }: AdminViewProps) {
  const { lastEvent } = useRealtime();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'inventory' | 'orders' | 'payments' | 'waiting_list' | 'customers' | 'reports' | 'audit_logs'>('dashboard');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Waiting List Data
  const [waitingList, setWaitingList] = useState<any[]>([]);
  
  // Products Data
  const [products, setProducts] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Inventory Data
  const [inventory, setInventory] = useState<any[]>([]);
  const [adjustModal, setAdjustModal] = useState<{ variantId: number; title: string; current: number } | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('stock_in');

  // Orders Data
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [historyModal, setHistoryModal] = useState<{ order: any; history: any[] } | null>(null);
  const [shipModal, setShipModal] = useState<{ order: any; tracking: string } | null>(null);

  // Payments Data
  const [payments, setPayments] = useState<any[]>([]);
  const [verifyModal, setVerifyModal] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Customers Data
  const [customers, setCustomers] = useState<any[]>([]);

  // Reports Data
  const [salesReport, setSalesReport] = useState<any>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Add Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCatId, setNewProdCatId] = useState(1);
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdPromo, setNewProdPromo] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImg, setNewProdImg] = useState('');

  const token = localStorage.getItem('skyra_token') || 'user_1';
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const loadDashboard = () => {
    fetch('/api/admin/dashboard', { headers: authHeaders })
      .then(res => res.json())
      .then(setDashboardData);
  };

  const loadProducts = () => {
    fetch('/api/admin/products', { headers: authHeaders })
      .then(res => res.json())
      .then(d => setProducts(d.products || []));
  };

  const loadInventory = () => {
    fetch('/api/admin/inventory', { headers: authHeaders })
      .then(res => res.json())
      .then(d => setInventory(d.items || []));
  };

  const loadOrders = () => {
    const url = orderStatusFilter ? `/api/admin/orders?status=${orderStatusFilter}` : '/api/admin/orders';
    fetch(url, { headers: authHeaders })
      .then(res => res.json())
      .then(d => setOrders(d.orders || []));
  };

  const loadPayments = () => {
    fetch('/api/admin/payments', { headers: authHeaders })
      .then(res => res.json())
      .then(d => setPayments(d.payments || []));
  };

  const loadWaitingList = () => {
    fetch('/api/admin/waiting-list', { headers: authHeaders })
      .then(res => res.json())
      .then(d => setWaitingList(d.waitingList || []));
  };

  const loadCustomers = () => {
    fetch('/api/admin/customers', { headers: authHeaders })
      .then(res => res.json())
      .then(d => setCustomers(d.customers || []));
  };

  const loadReports = () => {
    fetch('/api/admin/reports/sales', { headers: authHeaders })
      .then(res => res.json())
      .then(setSalesReport);
  };

  const loadAuditLogs = () => {
    fetch('/api/admin/audit-logs', { headers: authHeaders })
      .then(res => res.json())
      .then(d => setAuditLogs(d.logs || []));
  };

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
    loadDashboard();
    loadWaitingList();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'inventory') loadInventory();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'payments') loadPayments();
    if (activeTab === 'waiting_list') loadWaitingList();
    if (activeTab === 'customers') loadCustomers();
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'audit_logs') loadAuditLogs();
  }, [activeTab, orderStatusFilter]);

  // Real-time synchronization for Admin Dashboard!
  useEffect(() => {
    if (lastEvent) {
      if (activeTab === 'dashboard') loadDashboard();
      if (activeTab === 'inventory' || lastEvent.type === 'STOCK_UPDATE') loadInventory();
      if (activeTab === 'orders' || lastEvent.type === 'NEW_ORDER') loadOrders();
      if (activeTab === 'payments' || activeTab === 'waiting_list' || lastEvent.type === 'PAYMENT_STATUS_CHANGED') {
        loadPayments();
        loadWaitingList();
      }
    }
  }, [lastEvent]);

  // Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: newProdName,
          sku: newProdSku,
          category_id: Number(newProdCatId),
          normal_price: Number(newProdPrice),
          promo_price: newProdPromo ? Number(newProdPromo) : null,
          description: newProdDesc,
          images: newProdImg ? [newProdImg] : []
        })
      });
      if (res.ok) {
        setShowAddProduct(false);
        setNewProdName('');
        setNewProdSku('');
        setNewProdPrice('');
        loadProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: authHeaders });
    loadProducts();
  };

  const handleAdjustStock = async () => {
    if (!adjustModal || !adjustQty) return;
    try {
      await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          variantId: adjustModal.variantId,
          type: adjustType,
          quantity: Number(adjustQty),
          note: `Penyesuaian manual ${adjustType}`
        })
      });
      setAdjustModal(null);
      setAdjustQty('');
      loadInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderNumber: string, status: string, trackingNum?: string) => {
    await fetch(`/api/admin/orders/${orderNumber}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status, trackingNumber: trackingNum || trackingInput || undefined })
    });
    setTrackingInput('');
    loadOrders();
    if (selectedOrder) setSelectedOrder(null);
  };

  const handleViewOrderHistory = async (orderNumber: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/history`, { headers: authHeaders });
      const data = await res.json();
      if (data.order) {
        setHistoryModal({ order: data.order, history: data.history || [] });
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
    }
  };

  const handleVerifyPayment = async (action: 'APPROVE' | 'REJECT') => {
    if (!verifyModal) return;
    await fetch(`/api/admin/payments/${verifyModal.id}/verify`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ action, adminNotes })
    });
    setVerifyModal(null);
    setAdminNotes('');
    loadPayments();
    loadWaitingList();
    loadDashboard();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <div className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 font-black flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-wide text-white">SKYRA MARINE ADMIN PANEL</h1>
            <p className="text-[10px] text-cyan-400">Database Single Source of Truth • Realtime Synchronized</p>
          </div>
        </div>

        <button
          onClick={onBackToStore}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
        >
          &larr; Kembali ke Tampilan Customer
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Admin Sidebar Navigation */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800/80 p-4 space-y-1 text-xs font-semibold flex-shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'dashboard' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'products' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produk &amp; Varian</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'inventory' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventaris &amp; Stok</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'orders' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Pesanan Masuk</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'payments' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Verifikasi Pembayaran</span>
          </button>

          <button
            onClick={() => setActiveTab('waiting_list')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
              activeTab === 'waiting_list' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4" />
              <span>Antrian Waiting List</span>
            </div>
            {waitingList.length > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'waiting_list' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {waitingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'customers' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Pelanggan</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'reports' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Laporan Penjualan</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'audit_logs' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Log Sistem</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-900 space-y-6">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && dashboardData && (
            <div className="space-y-6">
              {/* Metric KPI Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-bold">Total Penjualan Lunas</span>
                  <p className="text-2xl font-black text-white">
                    Rp {dashboardData.metrics.totalSales.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-bold">Total Pesanan</span>
                  <p className="text-2xl font-black text-cyan-400">
                    {dashboardData.metrics.totalOrders}
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('waiting_list')}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-amber-400/80 cursor-pointer transition-all space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 uppercase font-bold group-hover:text-amber-300">Menunggu Verifikasi</span>
                    <Clock className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-2xl font-black text-amber-400">
                    {dashboardData.metrics.pendingPayments}
                  </p>
                  <span className="text-[10px] text-amber-300/80">Buka Antrian Waiting List &rarr;</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-bold">Peringatan Low Stock (&le;5)</span>
                  <p className="text-2xl font-black text-rose-400">
                    {dashboardData.metrics.lowStockCount}
                  </p>
                </div>
              </div>

              {/* Best Sellers and Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                  <h3 className="font-bold text-sm text-white border-b border-slate-700 pb-2">
                    Produk Paling Laris (Best Sellers)
                  </h3>
                  <div className="space-y-2">
                    {dashboardData.bestSellers?.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 text-xs">
                        <span className="font-semibold text-slate-200 line-clamp-1">{p.name}</span>
                        <span className="font-bold text-cyan-400 whitespace-nowrap">{p.sold_count} terjual</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                  <h3 className="font-bold text-sm text-white border-b border-slate-700 pb-2">
                    Pesanan Terbaru
                  </h3>
                  <div className="space-y-2">
                    {dashboardData.recentOrders?.map((ord: any) => (
                      <div key={ord.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 text-xs">
                        <div>
                          <strong className="text-white">#{ord.order_number}</strong>
                          <span className="text-slate-400 ml-2">{ord.recipient_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-200 block">Rp {ord.grand_total.toLocaleString('id-ID')}</span>
                          <span className="text-[10px] text-cyan-400">{ord.order_status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Manajemen Produk ({products.length})</h2>
                  <p className="text-xs text-slate-400">Tambah, ubah harga, hapus, dan atur varian produk</p>
                </div>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>

              {/* Add Product Modal */}
              {showAddProduct && (
                <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <h3 className="font-bold text-sm text-white">Form Tambah Produk Baru</h3>
                    <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Nama Produk</label>
                      <input
                        type="text"
                        required
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                        placeholder="Cth: Carbon Surf Fins Pro"
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">SKU Induk</label>
                      <input
                        type="text"
                        required
                        value={newProdSku}
                        onChange={e => setNewProdSku(e.target.value)}
                        placeholder="Cth: SKY-SRF-099"
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">Kategori</label>
                      <select
                        value={newProdCatId}
                        onChange={e => setNewProdCatId(Number(e.target.value))}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl outline-none text-white"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">Harga Normal (Rp)</label>
                      <input
                        type="number"
                        required
                        value={newProdPrice}
                        onChange={e => setNewProdPrice(e.target.value)}
                        placeholder="500000"
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">Harga Promo (Rp)</label>
                      <input
                        type="number"
                        value={newProdPromo}
                        onChange={e => setNewProdPromo(e.target.value)}
                        placeholder="450000"
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">URL Foto Produk</label>
                      <input
                        type="text"
                        value={newProdImg}
                        onChange={e => setNewProdImg(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-slate-300 block mb-1">Deskripsi Lengkap</label>
                      <textarea
                        rows={2}
                        value={newProdDesc}
                        onChange={e => setNewProdDesc(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddProduct(false)}
                        className="px-4 py-2 bg-slate-700 text-white rounded-xl"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl"
                      >
                        Simpan ke Database
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Products Table */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">Produk</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Harga</th>
                      <th className="p-3">Stok Siap</th>
                      <th className="p-3">Terjual</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-700/40">
                        <td className="p-3 flex items-center gap-2.5">
                          <img
                            src={p.primary_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=100'}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                          <div>
                            <strong className="text-white block line-clamp-1">{p.name}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">{p.category_name}</td>
                        <td className="p-3 font-bold text-white">
                          Rp {(p.promo_price || p.normal_price).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.total_available_stock <= 5 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {p.total_available_stock || 0} unit
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{p.sold_count || 0}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">Manajemen Inventaris Berdasarkan Varian SKU</h2>
                <p className="text-xs text-slate-400">Formula: Available Stock = Current Stock - Reserved Stock</p>
              </div>

              {/* Adjust Stock Modal */}
              {adjustModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                  <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-white">Penyesuaian Stok: {adjustModal.title}</h3>
                    <p className="text-slate-400">Stok Fisik Saat Ini: {adjustModal.current} unit</p>
                    <div className="space-y-2">
                      <select
                        value={adjustType}
                        onChange={e => setAdjustType(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
                      >
                        <option value="stock_in">Tambah Stok Masuk (Stock In)</option>
                        <option value="stock_out">Kurangi Stok (Stock Out)</option>
                        <option value="adjustment">Set Stok Fisik Absolut</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Jumlah unit"
                        value={adjustQty}
                        onChange={e => setAdjustQty(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setAdjustModal(null)} className="px-4 py-2 bg-slate-700 text-white rounded-xl">Batal</button>
                      <button onClick={handleAdjustStock} className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl">Simpan Perubahan</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">SKU Varian</th>
                      <th className="p-3">Nama Produk &amp; Varian</th>
                      <th className="p-3">Stok Fisik (Current)</th>
                      <th className="p-3">Di-Reserve (Checkout)</th>
                      <th className="p-3">Stok Siap (Available)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {inventory.map((inv: any) => (
                      <tr key={inv.variant_id} className="hover:bg-slate-700/40">
                        <td className="p-3 font-mono font-bold text-cyan-400">{inv.sku}</td>
                        <td className="p-3">
                          <strong className="text-white block">{inv.product_name}</strong>
                          <span className="text-[10px] text-slate-400">{inv.variant_title}</span>
                        </td>
                        <td className="p-3 text-slate-200">{inv.current_stock} unit</td>
                        <td className="p-3 text-amber-400 font-semibold">{inv.reserved_stock} unit</td>
                        <td className="p-3">
                          <span className="font-extrabold text-white text-sm">{inv.available_stock} unit</span>
                        </td>
                        <td className="p-3">
                          {inv.available_stock <= 0 ? (
                            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded text-[10px] font-bold">
                              Habis (OOS)
                            </span>
                          ) : inv.available_stock <= inv.low_stock_threshold ? (
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[10px] font-bold">
                              Low Stock (&le;5)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                              Aman
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setAdjustModal({ variantId: inv.variant_id, title: `${inv.product_name} (${inv.variant_title})`, current: inv.current_stock })}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[11px]"
                          >
                            Sesuaikan Stok
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Manajemen Seluruh Pesanan</h2>
                  <p className="text-xs text-slate-400">Verifikasi, kemas barang, dan masukkan nomor resi ekspedisi</p>
                </div>

                <div className="flex gap-2 text-xs">
                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
                  >
                    <option value="">Semua Status</option>
                    <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                    <option value="PAYMENT_VERIFICATION">PAYMENT_VERIFICATION</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED (Pesanan Keluar)</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              {/* Ship / Outgoing Dispatch Modal */}
              {shipModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
                  <div className="p-6 bg-slate-800 rounded-3xl border border-slate-700 w-full max-w-md space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">Catat Pesanan Keluar Gudang</h3>
                          <p className="text-[11px] text-slate-400 font-mono">#{shipModal.order.order_number}</p>
                        </div>
                      </div>
                      <button onClick={() => setShipModal(null)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-emerald-200 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> Waktu Pesanan Keluar Dicatat Otomatis:
                      </p>
                      <p className="font-mono text-xs font-bold text-white">
                        {formatFullDateTime(new Date().toISOString())}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Waktu ini akan dicatat ke dalam sistem log dan dapat dilihat oleh pelanggan.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">
                        Nomor Resi Pelayaran / Ekspedisi ({shipModal.order.shipping_method}):
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: SKY-JNE-992144"
                        value={shipModal.tracking}
                        onChange={(e) => setShipModal({ ...shipModal, tracking: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShipModal(null)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateOrderStatus(shipModal.order.order_number, 'SHIPPED', shipModal.tracking);
                          setShipModal(null);
                        }}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Kirim Pesanan (Catat Jam Keluar)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Full Timestamp History Modal */}
              {historyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                  <div className="p-6 bg-slate-800 rounded-3xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
                          <History className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">
                            Audit Waktu &amp; Status Pesanan #{historyModal.order.order_number}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Penerima: {historyModal.order.recipient_name} ({historyModal.order.shipping_city})
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setHistoryModal(null)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Matrix of Waktu Masuk & Waktu Keluar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                          <LogIn className="w-3 h-3 text-blue-400" /> Jam Pesanan Masuk
                        </span>
                        <span className="font-mono font-bold text-white text-[11px] block mt-1">
                          {formatFullDateTime(historyModal.order.incoming_at || historyModal.order.created_at)}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                          <LogOut className="w-3 h-3 text-emerald-400" /> Jam Pesanan Keluar
                        </span>
                        <span className="font-mono font-bold text-emerald-300 text-[11px] block mt-1">
                          {historyModal.order.shipped_at ? formatFullDateTime(historyModal.order.shipped_at) : 'Belum Keluar'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                          <Timer className="w-3 h-3 text-purple-400" /> Durasi Proses
                        </span>
                        <span className="font-mono font-bold text-purple-300 text-[11px] block mt-1">
                          {formatElapsedDuration(
                            historyModal.order.incoming_at || historyModal.order.created_at,
                            historyModal.order.shipped_at || historyModal.order.delivered_at
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Timeline of events */}
                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                        Log Kronologis Waktu (Detik per Detik)
                      </h4>
                      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-3 divide-y divide-slate-800 space-y-2">
                        {historyModal.history.map((h: any, idx: number) => (
                          <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  h.event_type === 'PESANAN_MASUK' ? 'bg-blue-400' :
                                  h.event_type === 'PESANAN_KELUAR' ? 'bg-emerald-400' :
                                  h.event_type === 'PESANAN_SELESAI' ? 'bg-purple-400' :
                                  'bg-cyan-400'
                                }`} />
                                <strong className="text-white text-xs">{h.title}</strong>
                                <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[9px] font-mono">
                                  {h.status}
                                </span>
                              </div>
                              {h.description && (
                                <p className="text-slate-400 text-[11px] pl-4">{h.description}</p>
                              )}
                              <p className="text-slate-500 text-[10px] pl-4">
                                Aktor: {h.actor || 'Sistem'}
                              </p>
                            </div>
                            <span className="font-mono text-cyan-300 text-[11px] font-bold bg-slate-800 px-2 py-0.5 rounded whitespace-nowrap">
                              {formatFullDateTime(h.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setHistoryModal(null)}
                        className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">No. Pesanan</th>
                      <th className="p-3">Penerima &amp; Kota</th>
                      <th className="p-3">Jam Masuk (Waktu Masuk)</th>
                      <th className="p-3">Jam Keluar (Waktu Dikirim)</th>
                      <th className="p-3">Total Tagihan</th>
                      <th className="p-3">Status Bayar</th>
                      <th className="p-3">Status Order</th>
                      <th className="p-3">Resi Kurir</th>
                      <th className="p-3">Ubah Status &amp; Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {orders.map((ord: any) => {
                      const incomingTime = ord.incoming_at || ord.created_at;
                      const outgoingTime = ord.shipped_at;

                      return (
                        <tr key={ord.id} className="hover:bg-slate-700/40">
                          <td className="p-3 font-mono font-bold text-white">#{ord.order_number}</td>
                          <td className="p-3">
                            <strong className="text-slate-200 block">{ord.recipient_name}</strong>
                            <span className="text-[10px] text-slate-400">{ord.shipping_city}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <LogIn className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              <div>
                                <span className="font-mono text-white text-[11px] font-bold block">
                                  {formatShortDateTime(incomingTime)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {formatFullDateTime(incomingTime).split(',')[1]}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {outgoingTime ? (
                              <div className="flex items-center gap-1.5 text-emerald-300">
                                <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                                <div>
                                  <span className="font-mono text-[11px] font-bold block text-emerald-300">
                                    {formatShortDateTime(outgoingTime)}
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-mono">
                                    {formatFullDateTime(outgoingTime).split(',')[1]}
                                  </span>
                                </div>
                              </div>
                            ) : ord.order_status === 'COMPLETED' ? (
                              <span className="text-purple-300 font-mono text-[11px] font-bold">Tiba di Tujuan</span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Belum Keluar</span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-white">
                            Rp {ord.grand_total.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.payment_status === 'PAID' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                            }`}>
                              {ord.payment_status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-bold text-cyan-300">
                              {ord.order_status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-300">
                            {ord.tracking_number || '-'}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={ord.order_status}
                                onChange={e => {
                                  if (e.target.value === 'SHIPPED') {
                                    setShipModal({ order: ord, tracking: ord.tracking_number || '' });
                                  } else {
                                    handleUpdateOrderStatus(ord.order_number, e.target.value);
                                  }
                                }}
                                className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px] outline-none"
                              >
                                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                                <option value="PROCESSING">PROCESSING</option>
                                <option value="PACKED">PACKED</option>
                                <option value="SHIPPED">SHIPPED (Pesanan Keluar)</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                              <button
                                onClick={() => handleViewOrderHistory(ord.order_number)}
                                title="Lihat Log Waktu & Detail"
                                className="p-1.5 bg-slate-700 hover:bg-cyan-600 text-white rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                              >
                                <History className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Log Waktu</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS VERIFICATION */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">Verifikasi Bukti Pembayaran Manual</h2>
                <p className="text-xs text-slate-400">Setujui untuk otomatis memotong stok &amp; mengubah status pesanan menjadi PROCESSING</p>
              </div>

              {/* Verify Modal with Struk Image */}
              {verifyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
                  <div className="p-6 bg-slate-800 rounded-3xl border border-slate-700 w-full max-w-lg space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <h3 className="font-bold text-sm text-white">Pemeriksaan Struk: #{verifyModal.order_number}</h3>
                      <button onClick={() => setVerifyModal(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-700">
                      <img src={verifyModal.proof_image} alt="" className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-1 text-slate-300">
                      <p>Bank Pengirim: <strong className="text-white">{verifyModal.bank_sender}</strong></p>
                      <p>Pemilik Rekening: <strong className="text-white">{verifyModal.sender_name}</strong></p>
                      <p>Total Tagihan: <strong className="text-cyan-400">Rp {verifyModal.grand_total.toLocaleString('id-ID')}</strong></p>
                    </div>

                    <input
                      type="text"
                      placeholder="Catatan admin (opsional jika approve, wajib jika reject)"
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => handleVerifyPayment('REJECT')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
                      >
                        Tolak Bukti
                      </button>
                      <button
                        onClick={() => handleVerifyPayment('APPROVE')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
                      >
                        Setujui Pembayaran (Lunas)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">Pesanan</th>
                      <th className="p-3">Metode</th>
                      <th className="p-3">Nominal</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Bukti Transfer</th>
                      <th className="p-3">Aksi Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {payments.map((pm: any) => (
                      <tr key={pm.id} className="hover:bg-slate-700/40">
                        <td className="p-3 font-mono font-bold text-white">#{pm.order_number}</td>
                        <td className="p-3 text-slate-300">{pm.payment_method}</td>
                        <td className="p-3 font-bold text-white">Rp {pm.amount.toLocaleString('id-ID')}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pm.status === 'PAID' ? 'bg-emerald-950 text-emerald-300' : pm.status === 'UNDER_REVIEW' ? 'bg-amber-950 text-amber-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {pm.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {pm.proof_image ? (
                            <button
                              onClick={() => setVerifyModal(pm)}
                              className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat Struk</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 italic">Belum diunggah</span>
                          )}
                        </td>
                        <td className="p-3">
                          {pm.status !== 'PAID' && pm.proof_image && (
                            <button
                              onClick={() => setVerifyModal(pm)}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px]"
                            >
                              Tinjau &amp; Setujui
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TRANSACTIONS WAITING LIST (ANTRIAN TRANSAKSI MENUNGGU) */}
          {activeTab === 'waiting_list' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>Antrian Transaksi Menunggu (Transactions Waiting List)</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      {waitingList.length} Transaksi
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pesanan dalam antrian verifikasi bukti struk bank transfer, proses QRIS, atau Virtual Account
                  </p>
                </div>

                <button
                  onClick={loadWaitingList}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 self-start"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Segarkan Antrian</span>
                </button>
              </div>

              {/* Waiting List KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 space-y-1">
                  <span className="text-[11px] text-amber-300 font-bold uppercase">Perlu Verifikasi Struk</span>
                  <p className="text-2xl font-black text-amber-400">
                    {waitingList.filter(o => o.order_status === 'PAYMENT_VERIFICATION').length} Pesanan
                  </p>
                  <span className="text-[10px] text-slate-400">Bukti struk bank sudah diunggah oleh pelanggan</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-[11px] text-cyan-300 font-bold uppercase">Menunggu Pembayaran</span>
                  <p className="text-2xl font-black text-white">
                    {waitingList.filter(o => o.order_status === 'PENDING_PAYMENT').length} Pesanan
                  </p>
                  <span className="text-[10px] text-slate-400">QRIS / VA menunggu transfer sebelum batas waktu</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-[11px] text-emerald-300 font-bold uppercase">Total Dana Tertahan</span>
                  <p className="text-2xl font-black text-emerald-400">
                    Rp {waitingList.reduce((acc, o) => acc + (o.grand_total || 0), 0).toLocaleString('id-ID')}
                  </p>
                  <span className="text-[10px] text-slate-400">Nilai omzet menunggu persetujuan atau pembayaran</span>
                </div>
              </div>

              {/* Waiting List Table */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden text-xs">
                {waitingList.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Check className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h3 className="font-bold text-white text-base">Semua Antrian Bersih!</h3>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      Tidak ada transaksi yang sedang menunggu verifikasi atau pembayaran. Semua pesanan telah diproses.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                      <tr>
                        <th className="p-3">No. Pesanan</th>
                        <th className="p-3">Jam Masuk Antrian</th>
                        <th className="p-3">Pelanggan &amp; Tujuan</th>
                        <th className="p-3">Rincian Barang</th>
                        <th className="p-3">Total &amp; Metode</th>
                        <th className="p-3">Status Antrian</th>
                        <th className="p-3">Bukti Struk</th>
                        <th className="p-3">Aksi Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {waitingList.map((ord: any) => {
                        const needsVerification = ord.order_status === 'PAYMENT_VERIFICATION' || ord.payment_status === 'UNDER_REVIEW';
                        const incomingTime = ord.incoming_at || ord.created_at;
                        return (
                          <tr key={ord.id} className={`hover:bg-slate-700/40 ${needsVerification ? 'bg-amber-950/20' : ''}`}>
                            <td className="p-3">
                              <span className="font-mono font-bold text-white block">#{ord.order_number}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                <div>
                                  <span className="font-mono text-white text-[11px] font-bold block">
                                    {formatShortDateTime(incomingTime)}
                                  </span>
                                  <span className="text-[10px] text-amber-300 font-mono block">
                                    {formatFullDateTime(incomingTime).split(',')[1]}
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    Antrian: {formatElapsedDuration(incomingTime)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <strong className="text-slate-200 block">{ord.recipient_name}</strong>
                              <span className="text-[10px] text-slate-400 block">{ord.recipient_phone}</span>
                              <span className="text-[10px] text-cyan-400">{ord.shipping_city}, {ord.shipping_province}</span>
                            </td>
                            <td className="p-3 max-w-xs">
                              <span className="text-slate-300 line-clamp-2 text-[11px]" title={ord.items_summary}>
                                {ord.items_summary || `${ord.items_count || 1} produk`}
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Ekspedisi: {ord.shipping_method}
                              </span>
                            </td>
                            <td className="p-3">
                              <strong className="text-white block font-bold">
                                Rp {ord.grand_total.toLocaleString('id-ID')}
                              </strong>
                              <span className="text-[10px] font-mono text-slate-400">
                                {ord.payment_method}
                              </span>
                            </td>
                            <td className="p-3">
                              {needsVerification ? (
                                <span className="px-2 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit shadow">
                                  <Clock className="w-3 h-3" />
                                  Verifikasi Struk
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold block w-fit">
                                  Menunggu Bayar
                                </span>
                              )}
                              {ord.notes && (
                                <span className="text-[10px] text-slate-400 italic block mt-1 line-clamp-1" title={ord.notes}>
                                  Catatan: "{ord.notes}"
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {ord.proof_image ? (
                                <button
                                  onClick={() => setVerifyModal({
                                    id: ord.payment_id || ord.id,
                                    order_number: ord.order_number,
                                    proof_image: ord.proof_image,
                                    bank_sender: ord.bank_sender || '-',
                                    sender_name: ord.sender_name || ord.recipient_name,
                                    grand_total: ord.grand_total
                                  })}
                                  className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Lihat Bukti</span>
                                </button>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">Belum upload</span>
                              )}
                            </td>
                            <td className="p-3">
                              {needsVerification && ord.proof_image ? (
                                <button
                                  onClick={() => setVerifyModal({
                                    id: ord.payment_id || ord.id,
                                    order_number: ord.order_number,
                                    proof_image: ord.proof_image,
                                    bank_sender: ord.bank_sender || '-',
                                    sender_name: ord.sender_name || ord.recipient_name,
                                    grand_total: ord.grand_total
                                  })}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[11px] shadow-sm flex items-center gap-1 transition-transform active:scale-95"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Tinjau &amp; Setujui</span>
                                </button>
                              ) : (
                                <select
                                  value={ord.order_status}
                                  onChange={e => handleUpdateOrderStatus(ord.order_number, e.target.value)}
                                  className="p-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-[10px] outline-none"
                                >
                                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                                  <option value="PROCESSING">Tandai Diproses</option>
                                  <option value="CANCELLED">Batalkan Pesanan</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMERS MANAGEMENT */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Daftar Akun Pelanggan ({customers.length})</h2>
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">Pelanggan</th>
                      <th className="p-3">Kontak</th>
                      <th className="p-3">Total Pesanan</th>
                      <th className="p-3">Total Belanja</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {customers.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-700/40">
                        <td className="p-3">
                          <strong className="text-white block">{c.name}</strong>
                          <span className="text-[10px] text-slate-400">{c.email}</span>
                        </td>
                        <td className="p-3 text-slate-300">{c.phone || '-'}</td>
                        <td className="p-3 text-slate-300">{c.total_orders} pesanan</td>
                        <td className="p-3 font-bold text-white">Rp {c.total_spend.toLocaleString('id-ID')}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: REPORTS */}
          {activeTab === 'reports' && salesReport && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Laporan Keuangan &amp; Penjualan</h2>
                  <p className="text-xs text-slate-400">
                    Total Pendapatan Bersih: <strong className="text-cyan-400">Rp {salesReport.summary.totalRevenue.toLocaleString('id-ID')}</strong> ({salesReport.summary.totalOrders} transaksi)
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/admin/reports/sales?format=csv`}
                    download
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Ekspor CSV</span>
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-cyan-400" />
                    <span>Cetak Laporan</span>
                  </button>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700 space-y-3">
                <h3 className="font-bold text-sm text-white border-b border-slate-700 pb-2">Penjualan per Kategori</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {salesReport.categoryBreakdown?.map((cat: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-900 rounded-xl">
                      <span className="text-slate-400 block text-[11px]">{cat.category_name}</span>
                      <strong className="text-white text-sm block mt-0.5">Rp {cat.total_revenue.toLocaleString('id-ID')}</strong>
                      <span className="text-[10px] text-cyan-400">{cat.items_sold} barang</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT LOGS */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Log Aktivitas &amp; Keamanan Admin</h2>
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Admin</th>
                      <th className="p-3">Aksi</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Nilai Lama</th>
                      <th className="p-3">Nilai Baru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 font-mono text-[11px]">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-700/40">
                        <td className="p-3 text-slate-400">{log.created_at}</td>
                        <td className="p-3 text-slate-300 font-sans">{log.user_email}</td>
                        <td className="p-3 text-cyan-300 font-bold">{log.action}</td>
                        <td className="p-3 text-slate-400">{log.resource}:{log.target_id}</td>
                        <td className="p-3 text-slate-400 truncate max-w-xs">{log.old_values || '-'}</td>
                        <td className="p-3 text-emerald-400 truncate max-w-xs">{log.new_values || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
