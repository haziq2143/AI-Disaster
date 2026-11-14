'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldAlert,
  User,
  Radio,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import GuardianShieldLogo from './GuardianShieldLogo';

export default function AuthScreen({ 
  onAuthenticated, 
  onContinueGuest, 
  onContinueGuestSar, 
  onOpenOfflineCard, 
  onBackToLanding,
  offlineCardAvailable = false, 
  initialError = '',
  initialMode = 'login'
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [showSarField, setShowSarField] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const handleResetLink = () => {
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
      const endpoint = mode === 'forgot' ? 'password-reset'
        : mode === 'reset' ? 'reset-password'
          : mode === 'register' ? 'register' : 'login';
      const payload = mode === 'forgot' ? { email }
        : mode === 'reset' ? { token: resetToken, password }
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
    <div className="min-h-screen bg-[#F1F3F9] text-slate-800 flex flex-col justify-between font-sans selection:bg-indigo-600 selection:text-white p-4 sm:p-6 lg:p-10">
      {/* Top Header Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-1">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-xs transition-all hover:scale-102 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Beranda</span>
        </button>

        <div className="flex items-center gap-2">
          <GuardianShieldLogo size={24} />
          <span className="font-extrabold text-sm text-[#0D47A1] tracking-tight">Evacu8</span>
        </div>
      </div>

      {/* Main Card Container */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-8">
        <div className="w-full max-w-[960px] bg-white rounded-[32px] sm:rounded-[36px] shadow-[0_24px_70px_rgba(20,30,60,0.07)] border border-slate-100 p-4 sm:p-5 lg:p-6 animate-scaleIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* LEFT COLUMN: Dreamy Gradient & Mesh Artwork (5 cols) */}
            <div 
              className="lg:col-span-5 rounded-[26px] p-8 sm:p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[280px] sm:min-h-[400px] lg:min-h-[560px] shadow-lg shadow-indigo-900/15"
              style={{
                background: `
                  radial-gradient(circle at 85% 15%, rgba(196, 181, 253, 0.85) 0%, transparent 45%),
                  radial-gradient(circle at 15% 25%, rgba(96, 165, 250, 0.6) 0%, transparent 50%),
                  radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.5) 0%, transparent 55%),
                  linear-gradient(145deg, #1E3A8A 0%, #2563EB 35%, #4F46E5 70%, #7C3AED 100%)
                `
              }}
            >
              {/* Soft Ambient Light Glows */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-violet-300/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 -left-10 w-64 h-64 bg-blue-400/25 rounded-full blur-3xl pointer-events-none" />

              {/* Top Asterisk / Star Icon */}
              <div className="relative z-10">
                <span className="text-3xl sm:text-4xl font-black text-white/90 select-none block leading-none">
                  ✱
                </span>
              </div>

              {/* Bottom Editorial Copy */}
              <div className="relative z-10 mt-auto pt-10">
                <p className="text-xs sm:text-sm font-medium text-blue-100/90 tracking-wide mb-2">
                  {mode === 'register' ? 'Mulai Bersama Evacu8' : 'Kesiapsiagaan Cepat'}
                </p>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug text-white mb-3">
                  {mode === 'register' 
                    ? 'Satu akses terpadu untuk keselamatan keluarga Anda.'
                    : 'Akses cepat saat detik paling berharga.'}
                </h2>

                <p className="text-xs sm:text-[13px] text-blue-100/80 leading-relaxed font-normal">
                  Panduan evakuasi 1-langkah, koordinasi status keluarga tanpa pulsa, dan integrasi posko SAR terverifikasi.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Clean, High-End Minimalist Form (7 cols) */}
            <div className="lg:col-span-7 px-2 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-between">
              <div>
                {/* Minimalist Asterisk Symbol */}
                <div className="mb-4">
                  <span className="text-2xl font-black text-[#4F46E5] select-none block leading-none">
                    ✱
                  </span>
                </div>

                {/* Form Title & Subtitle */}
                <div className="mb-8">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {mode === 'login' ? 'Masuk ke akun'
                      : mode === 'register' ? 'Buat akun baru'
                      : mode === 'forgot' ? 'Pemulihan kata sandi'
                      : 'Atur kata sandi baru'}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                    {mode === 'login' 
                      ? 'Akses rute evakuasi, data posko SAR, dan pantau status keselamatan keluarga.'
                      : mode === 'register'
                        ? 'Simpan profil keselamatan, sinkronisasi perangkat, dan dapatkan instruksi darurat.'
                        : 'Masukkan alamat email Anda untuk menerima tautan pembaruan kata sandi.'}
                  </p>
                </div>

                {/* Form Body */}
                <div key={mode} className="animate-fadeIn">
                  <form onSubmit={submit} className="space-y-4">
                    {mode === 'register' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Nama lengkap
                        </label>
                        <input
                          required
                          minLength={2}
                          maxLength={80}
                          autoComplete="name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Nama lengkap Anda"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                    )}

                    {['login', 'register', 'forgot'].includes(mode) && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Email Anda
                        </label>
                        <input
                          required
                          type="email"
                          autoComplete="email"
                          maxLength={254}
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="nama@email.com"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                    )}

                    {['login', 'register', 'reset'].includes(mode) && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            {mode === 'reset' ? 'Password baru' : 'Kata sandi'}
                          </label>
                          {mode === 'login' && (
                            <button
                              type="button"
                              onClick={() => changeMode('forgot')}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                            >
                              Lupa kata sandi?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            required
                            type={showPassword ? 'text' : 'password'}
                            minLength={mode === 'register' || mode === 'reset' ? 10 : undefined}
                            maxLength={128}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={mode === 'login' ? '••••••••••••' : 'Minimal 10 karakter'}
                            className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'reset' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Konfirmasi password baru
                        </label>
                        <input
                          required
                          type="password"
                          minLength={10}
                          maxLength={128}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password baru"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                    )}

                    {/* Subtle Expandable Option for Admin / SAR Passcode */}
                    {mode === 'register' && (
                      <div>
                        {!showSarField ? (
                          <button
                            type="button"
                            onClick={() => setShowSarField(true)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <span>+ Punya kode verifikasi Tim SAR?</span>
                          </button>
                        ) : (
                          <div className="pt-1 animate-fadeIn">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Kode Akses Admin SAR (Opsional)
                            </label>
                            <input
                              type="password"
                              autoComplete="off"
                              maxLength={128}
                              value={bootstrapSecret}
                              onChange={e => setBootstrapSecret(e.target.value)}
                              placeholder="Hanya bila diinstruksikan admin server"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {notice && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{notice}</span>
                      </div>
                    )}

                    {resetUrl && (
                      <a
                        href={resetUrl}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition-all shadow-md"
                      >
                        Buka Tautan Reset Password
                      </a>
                    )}

                    {/* Primary Button (Matches Dribbble Glow Button) */}
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full py-3.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-extrabold text-sm shadow-[0_10px_25px_rgba(67,56,202,0.35)] hover:shadow-[0_12px_30px_rgba(67,56,202,0.45)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-3"
                    >
                      <span>
                        {busy ? 'Memproses…' : mode === 'register' ? 'Daftar Sekarang'
                          : mode === 'forgot' ? 'Kirim Tautan Reset' : mode === 'reset' ? 'Simpan Sandi Baru'
                            : 'Masuk Sekarang'}
                      </span>
                      {!busy && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>

                  {['forgot', 'reset'].includes(mode) && (
                    <button
                      type="button"
                      onClick={() => changeMode('login')}
                      className="mt-3 w-full text-center text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      ← Kembali ke halaman masuk
                    </button>
                  )}
                </div>

                {/* Subtle Divider: or continue with */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-medium text-slate-400">
                    atau akses cepat tanpa akun
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* 3 Clean Rounded Pills (Like Behance/Google/Facebook in Reference) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onContinueGuest}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs hover-lift"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Mode Tamu</span>
                  </button>

                  <button
                    type="button"
                    onClick={onContinueGuestSar}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs hover-lift"
                  >
                    <ShieldAlert className="w-4 h-4 text-[#4338CA]" />
                    <span>Akses Cepat SAR</span>
                  </button>
                </div>

                {offlineCardAvailable && (
                  <button
                    type="button"
                    onClick={onOpenOfflineCard}
                    className="mt-2.5 w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Buka Kartu Identitas Darurat Offline</span>
                  </button>
                )}
              </div>

              {/* Bottom Switch Link */}
              <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                {mode === 'login' ? (
                  <p>
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => changeMode('register')}
                      className="font-extrabold text-[#4338CA] hover:underline cursor-pointer"
                    >
                      Daftar Akun Baru
                    </button>
                  </p>
                ) : mode === 'register' ? (
                  <p>
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => changeMode('login')}
                      className="font-extrabold text-[#4338CA] hover:underline cursor-pointer"
                    >
                      Masuk Sekarang
                    </button>
                  </p>
                ) : null}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-2 text-center text-[11px] text-slate-400">
        Evacu8 — Sistem Keselamatan & Evakuasi Cepat Terpadu
      </footer>
    </div>
  );
}
