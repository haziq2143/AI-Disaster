'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function AuthScreen({ onAuthenticated, onContinueGuest, initialError = '' }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handleResetLink = () => {
      const verificationMatch = window.location.hash.match(/^#verifyEmail=([A-Za-z0-9_-]{43})$/);
      if (verificationMatch) {
        setVerificationToken(verificationMatch[1]);
        setPassword('');
        setConfirmPassword('');
        setError('');
        setNotice('Tautan email ditemukan. Konfirmasi untuk menyelesaikan verifikasi.');
        setMode('verify');
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        return;
      }
      const match = window.location.hash.match(/^#resetPassword=([A-Za-z0-9_-]{43})$/);
      if (!match) return;
      setResetToken(match[1]);
      setPassword('');
      setConfirmPassword('');
      setError('');
      setNotice('');
      setMode('reset');
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    };

    handleResetLink();
    window.addEventListener('hashchange', handleResetLink);
    return () => window.removeEventListener('hashchange', handleResetLink);
  }, []);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    setResetUrl('');
    try {
      if (mode === 'reset' && password !== confirmPassword) {
        throw new Error('Konfirmasi password tidak cocok.');
      }
      if (mode === 'verify' && !verificationToken) {
        throw new Error('Tautan verifikasi tidak ditemukan. Buka tautan yang dikirim ke email Anda.');
      }
      const endpoint = mode === 'forgot' ? 'password-reset'
        : mode === 'reset' ? 'reset-password'
          : mode === 'register' ? 'register'
            : mode === 'verify' ? 'verify-email'
              : mode === 'resend-verification' ? 'resend-verification' : 'login';
      const payload = mode === 'forgot' ? { email }
        : mode === 'reset' ? { token: resetToken, password }
          : mode === 'verify' ? { token: verificationToken }
            : mode === 'resend-verification' ? { email }
              : { name, email, password, bootstrapSecret };
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Autentikasi gagal. Coba lagi.');
      if (mode === 'forgot') {
        setNotice(result.message);
        setResetUrl(result.resetUrl || '');
      } else if (mode === 'reset') {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        setNotice(result.message);
      } else if (mode === 'register') {
        setMode('login');
        setNotice(result.message);
      } else if (mode === 'verify') {
        setMode('login');
        setVerificationToken('');
        setNotice(result.message);
      } else if (mode === 'resend-verification') {
        setMode('login');
        setNotice(result.message);
      } else {
        onAuthenticated(result.user);
      }
    } catch (submitError) {
      setError(submitError.message || 'Koneksi gagal. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const changeMode = nextMode => {
    setMode(nextMode);
    setError('');
    setNotice('');
    setResetUrl('');
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

        {['login', 'register'].includes(mode) && (
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => changeMode('login')} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === 'login' ? 'bg-white text-[#0D47A1] shadow-sm' : 'text-slate-600'}`}>
              Masuk
            </button>
            <button type="button" onClick={() => changeMode('register')} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === 'register' ? 'bg-white text-[#0D47A1] shadow-sm' : 'text-slate-600'}`}>
              Buat akun
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {['forgot', 'reset', 'verify', 'resend-verification'].includes(mode) && (
            <div>
              <h1 className="text-lg font-extrabold text-slate-800">
                {mode === 'forgot' ? 'Lupa password?' : mode === 'reset' ? 'Buat password baru'
                  : mode === 'verify' ? 'Verifikasi email' : 'Kirim ulang verifikasi'}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {mode === 'forgot' ? 'Masukkan email akun. Tautan reset demo hanya tersedia saat development.'
                  : mode === 'reset' ? 'Gunakan password baru dengan panjang 10–128 karakter.'
                    : mode === 'verify' ? 'Verifikasi alamat email untuk mengaktifkan akun.'
                      : 'Masukkan email akun. Jika belum diverifikasi, tautan baru akan dikirim.'}
              </p>
            </div>
          )}
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
          {['login', 'register', 'forgot', 'resend-verification'].includes(mode) && (
            <label className="block text-sm font-semibold text-slate-700">
              Email
              <input required type="email" autoComplete="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="form-control mt-1.5" placeholder="nama@email.com" />
            </label>
          )}
          {['login', 'register', 'reset'].includes(mode) && (
            <label className="block text-sm font-semibold text-slate-700">
              {mode === 'reset' ? 'Password baru' : 'Kata sandi'}
              <input required type="password" minLength={mode === 'register' || mode === 'reset' ? 10 : undefined} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} className="form-control mt-1.5" placeholder={mode === 'login' ? 'Kata sandi akun' : 'Minimal 10 karakter'} />
              {mode === 'register' && (
                <span className={`mt-1 block text-[11px] font-bold ${password.length >= 10 ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {password.length >= 10 ? 'Panjang kata sandi memenuhi syarat' : 'Wajib minimal 10 karakter'}
                </span>
              )}
            </label>
          )}
          {mode === 'reset' && (
            <label className="block text-sm font-semibold text-slate-700">
              Konfirmasi password baru
              <input required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="form-control mt-1.5" placeholder="Ulangi password baru" />
            </label>
          )}
          {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
          {mode === 'login' && error.includes('tidak cocok') && (
            <p className="pl-6 text-[11px] text-slate-600">
              Belum punya akun? Pilih tab <strong>Buat akun</strong> di atas atau lanjut sebagai tamu.
            </p>
          )}
          {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          {resetUrl && (
            <a href={resetUrl} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
              Buka tautan reset password
            </a>
          )}
          <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D47A1] px-4 py-3 font-bold text-white hover:bg-[#1565C0] disabled:opacity-60">
            {busy ? 'Memproses…' : mode === 'register' ? 'Buat akun'
              : mode === 'forgot' ? 'Kirim tautan reset' : mode === 'reset' ? 'Simpan password baru'
                : mode === 'verify' ? 'Verifikasi email'
                  : mode === 'resend-verification' ? 'Kirim ulang tautan' : 'Masuk'}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        {mode === 'login' && (
          <>
            <button type="button" onClick={() => changeMode('forgot')} className="mt-3 w-full text-center text-sm font-semibold text-[#0D47A1] hover:underline">
              Lupa password?
            </button>
            <button type="button" onClick={() => changeMode('resend-verification')} className="mt-2 w-full text-center text-sm font-semibold text-[#0D47A1] hover:underline">
              Belum menerima email verifikasi?
            </button>
          </>
        )}
        {['forgot', 'reset', 'verify', 'resend-verification'].includes(mode) && (
          <button type="button" onClick={() => changeMode('login')} className="mt-3 w-full text-center text-sm font-semibold text-[#0D47A1] hover:underline">
            Kembali ke halaman masuk
          </button>
        )}

        <p className="mt-5 text-xs leading-relaxed text-slate-500">
          Nama akun digunakan pada profil dan laporan. Akun baru otomatis menjadi pengguna biasa. Role Tim SAR hanya dapat diubah oleh admin.
        </p>
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
          Reset password demo langsung menampilkan tautan di halaman dan hanya tersedia saat development; email tidak dikirim. Untuk server produksi, pemulihan password belum dikonfigurasi. Untuk bahaya segera, hubungi layanan darurat resmi; aplikasi bukan kanal dispatch.
        </p>
        <button type="button" onClick={onContinueGuest} className="mt-4 min-h-11 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Lanjut sebagai tamu
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-500">Mode tamu tetap bisa memakai panduan lokal dan mengirim SOS anonim dengan persetujuan lokasi, tetapi tidak dapat sinkronisasi keluarga atau membuka panel SAR.</p>
      </section>
    </main>
  );
}
