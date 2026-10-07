import React from 'react';
import { Compass, ShieldCheck, Truck, RotateCcw, Award, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-12 pb-8">
      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-950/80 text-cyan-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">100% Produk Original</h4>
              <p className="text-[11px] text-slate-400">Garansi resmi brand laut</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-950/80 text-cyan-400 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ekspedisi Samudera</h4>
              <p className="text-[11px] text-slate-400">Kirim ke pulau &amp; resort</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-950/80 text-cyan-400 rounded-xl">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tukar Ukuran 7 Hari</h4>
              <p className="text-[11px] text-slate-400">Wetsuit &amp; fin fit guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-950/80 text-cyan-400 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Harga Grosir Otomatis</h4>
              <p className="text-[11px] text-slate-400">Hemat beli 5+ pcs langsung</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-5 gap-8 mb-12 text-xs">
        {/* Brand Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-400 flex items-center justify-center text-slate-950">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">SKYRA MARINE</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
            Marketplace modern perlengkapan laut, selancar, renang, scuba diving, watersports, pantai, dan keselamatan maritim di Indonesia. Terintegrasi inventaris real-time dan harga grosir transparan.
          </p>
          <div className="space-y-1.5 text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Canggu Coastal Hub &amp; Pelabuhan Benoa, Bali, Indonesia</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>Hotline WhatsApp: +62 812-3456-7890 (24/7 Marine Ops)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>support@skyra.marine</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-xs">Katalog Utama</h4>
          <ul className="space-y-2 text-slate-400">
            <li><a href="#surfing" className="hover:text-cyan-400 transition-colors">Surfboard &amp; Wetsuit</a></li>
            <li><a href="#diving" className="hover:text-cyan-400 transition-colors">Diving Mask &amp; BCD</a></li>
            <li><a href="#swimming" className="hover:text-cyan-400 transition-colors">Kacamata &amp; Fin Renang</a></li>
            <li><a href="#watersports" className="hover:text-cyan-400 transition-colors">Inflatable SUP &amp; Kayak</a></li>
            <li><a href="#marine" className="hover:text-cyan-400 transition-colors">Tali Tambat &amp; Lifebuoy</a></li>
            <li><a href="#beach" className="hover:text-cyan-400 transition-colors">Tenda Pantai &amp; Mat</a></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-xs">Layanan Pelanggan</h4>
          <ul className="space-y-2 text-slate-400">
            <li><a href="#track" className="hover:text-cyan-400 transition-colors">Lacak Pesanan</a></li>
            <li><a href="#payment" className="hover:text-cyan-400 transition-colors">Konfirmasi Pembayaran</a></li>
            <li><a href="#wholesale" className="hover:text-cyan-400 transition-colors">Ketentuan B2B &amp; Grosir</a></li>
            <li><a href="#guide" className="hover:text-cyan-400 transition-colors">Panduan Ukuran Wetsuit</a></li>
            <li><a href="#warranty" className="hover:text-cyan-400 transition-colors">Klaim Garansi</a></li>
          </ul>
        </div>

        {/* Payment & Security */}
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-xs">Metode Pembayaran</h4>
          <p className="text-[11px] text-slate-500 mb-3">Mendukung QRIS instan, Virtual Account, Transfer Bank manual dengan upload bukti, dan E-Wallet.</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 rounded">QRIS</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 rounded">BCA</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 rounded">Mandiri</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 rounded">GoPay</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 rounded">OVO</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <p>&copy; {new Date().getFullYear()} SKYRA Marine Marketplace. Hak cipta dilindungi undang-undang.</p>
        <p>Built with Real-Time Database, Atomic Stock Safety &amp; AI Vision Search Engine.</p>
      </div>
    </footer>
  );
}
