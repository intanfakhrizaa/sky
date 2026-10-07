import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, Plus, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Address } from '../types/index.ts';

export function ProfileView() {
  const { user, refreshUser } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // New address form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const loadAddresses = () => {
    const token = localStorage.getItem('skyra_token');
    if (!token) return;
    fetch('/api/auth/addresses', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((d) => setAddresses(d.addresses || []));
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setProfileMsg(null);

    const token = localStorage.getItem('skyra_token');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
    const token = localStorage.getItem('skyra_token');
    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Akun &amp; Alamat</h1>
        <p className="text-xs text-slate-500 mt-0.5">Kelola identitas, kontak, dan alamat pengiriman ekspedisi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Profile Card */}
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
              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                Role: {user?.role}
              </span>
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
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Telepon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
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
        </div>

        {/* Address Book Card */}
        <div className="md:col-span-7 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Buku Alamat Tersimpan</h3>
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
                  className="p-2 bg-white border border-slate-200 rounded-xl outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Nomor Telepon"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="p-2 bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <textarea
                required
                rows={2}
                placeholder="Alamat Lengkap / Dermaga / Villa..."
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none"
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
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl"
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
    </div>
  );
}
