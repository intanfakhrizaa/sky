import React, { useState } from 'react';
import { Compass, Shield, User, Lock, Mail, Phone, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginViewProps {
  onSuccess: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        const res = await register(name, email, password, phone);
        if (!res.success) {
          setError(res.error || 'Pendaftaran gagal');
        } else {
          onSuccess();
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Login gagal');
        } else {
          onSuccess();
        }
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setIsLoading(true);
    setError(null);
    const res = await login(demoEmail, demoPass);
    setIsLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Gagal login demo');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 flex items-center justify-center text-slate-950 mx-auto shadow-md">
            <Compass className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRegisterMode ? 'Daftar Akun SKYRA' : 'Masuk ke SKYRA Marine'}
          </h2>
          <p className="text-xs text-slate-500">
            Akses harga grosir eksklusif, lacak pesanan, dan simpan alamat
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegisterMode && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 8..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : isRegisterMode ? 'Daftar Sekarang' : 'Masuk Akun'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-600">
          {isRegisterMode ? (
            <span>
              Sudah punya akun?{' '}
              <button
                onClick={() => setIsRegisterMode(false)}
                className="text-cyan-700 font-bold hover:underline"
              >
                Masuk di sini
              </button>
            </span>
          ) : (
            <span>
              Belum punya akun?{' '}
              <button
                onClick={() => setIsRegisterMode(true)}
                className="text-cyan-700 font-bold hover:underline"
              >
                Daftar baru
              </button>
            </span>
          )}
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider">
            Akun Demo Pengujian Cepat:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('admin@skyra.marine', 'admin123')}
              className="p-2 rounded-xl bg-slate-900 text-cyan-300 hover:bg-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Captain (Admin)
            </button>
            <button
              onClick={() => handleDemoLogin('customer@skyra.marine', 'customer123')}
              className="p-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Bima (Customer)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
