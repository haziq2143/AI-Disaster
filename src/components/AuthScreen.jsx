'use client';

import React, { useState } from 'react';
import { AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function AuthScreen({ onAuthenticated, onContinueGuest, initialError = '' }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, password, bootstrapSecret })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Autentikasi gagal. Coba lagi.');
      onAuthenticated(result.user);
    } catch (submitError) {
      setError(submitError.message || 'Koneksi gagal. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const changeMode = nextMode => {
    setMode(nextMode);
    setError('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-sky-100 px-4 py-10">
      <section className="mx-auto max-w-md rounded-3xl border border-blue-100 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0D47A1] to-[#2196F3] text-white">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#0D47A1]">AI Disaster Assistant</p>
            <p className="text-xs text-slate-500">Masuk dengan akun untuk melanjutkan</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button type="button" onClick={() => changeMode('login')} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === 'login' ? 'bg-white text-[#0D47A1] shadow-sm' : 'text-slate-600'}`}>
            Masuk
          </button>
          <button type="button" onClick={() => changeMode('register')} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === 'register' ? 'bg-white text-[#0D47A1] shadow-sm' : 'text-slate-600'}`}>
            Buat akun
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <label className="block text-sm font-semibold text-slate-700">
              Nama sesuai akun
              <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={event => setName(event.target.value)} className="form-control mt-1.5" placeholder="Nama lengkap" />
            </label>
          )}
          {mode === 'register' && (
            <label className="block text-sm font-semibold text-slate-700">
              Kode bootstrap admin awal (opsional)
              <input type="password" autoComplete="off" maxLength={128} value={bootstrapSecret} onChange={event => setBootstrapSecret(event.target.value)} className="form-control mt-1.5" placeholder="Hanya jika diminta admin server" />
            </label>
          )}
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input required type="email" autoComplete="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="form-control mt-1.5" placeholder="nama@email.com" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Kata sandi
            <input required type="password" minLength={mode === 'register' ? 10 : undefined} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} className="form-control mt-1.5" placeholder={mode === 'register' ? 'Minimal 10 karakter' : 'Kata sandi akun'} />
            {mode === 'register' && (
              <span className={`text-[11px] block mt-1 font-bold ${password.length >= 10 ? 'text-emerald-700' : 'text-slate-500'}`}>
                {password.length >= 10 ? '✓ Panjang kata sandi memenuhi syarat' : 'Wajib minimal 10 karakter'}
              </span>
            )}
          </label>
          {error && (
            <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900 space-y-1">
              <div className="flex items-start gap-2 font-bold">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              {mode === 'login' && error.includes('tidak cocok') && (
                <p className="text-[11px] text-slate-600 pl-6">
                  Belum punya akun? Klik tab <strong>"Buat akun"</strong> di atas atau gunakan tombol <strong>"Lanjut sebagai tamu"</strong> di bawah.
                </p>
              )}
            </div>
          )}
          <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D47A1] px-4 py-3 font-bold text-white hover:bg-[#1565C0] disabled:opacity-60 cursor-pointer">
            {busy ? 'Memproses…' : mode === 'register' ? 'Buat akun' : 'Masuk'}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Uji coba cepat:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('demo@disaster.id');
                setPassword('rahasia12345');
                setError('');
              }}
              className="text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Isi data akun demo siap pakai
            </button>
          </div>
        )}

        <p className="mt-5 text-xs leading-relaxed text-slate-500">
          Nama akun digunakan pada profil dan laporan. Akun baru otomatis menjadi pengguna biasa. Role Tim SAR hanya dapat diubah oleh admin.
        </p>
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
          Prototype ini belum mengirim verifikasi email atau menyediakan pemulihan kata sandi. Untuk bahaya segera, hubungi layanan darurat resmi; aplikasi bukan kanal dispatch.
        </p>
        <button type="button" onClick={onContinueGuest} className="mt-4 min-h-11 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Lanjut sebagai tamu
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-500">Mode tamu tetap bisa memakai panduan lokal dan mengirim SOS anonim dengan persetujuan lokasi, tetapi tidak dapat sinkronisasi keluarga atau membuka panel SAR.</p>
      </section>
    </main>
  );
}
