'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  Check, 
  Users, 
  Share2, 
  Copy, 
  FileText, 
  Package
} from 'lucide-react';
import { OFFICIAL_SOURCES } from '../data/mockData';

export default function SafeConfirmation({ 
  hazardData, 
  familyMembers, 
  onResetFlow, 
  onNavigateScreen 
}) {
  const [confirmedSafe, setConfirmedSafe] = useState(false);
  const [locationReached, setLocationReached] = useState('Balai Warga RW 04 (Posko Utama)');
  const [registeredWithOfficer, setRegisteredWithOfficer] = useState(true);
  const [medicalCheckDone, setMedicalCheckDone] = useState(false);
  const [rationReceived, setRationReceived] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const familyCheckIns = (familyMembers || []).reduce((counts, member) => {
    const status = member.checkInStatus || (member.status === 'together' ? 'safe' : 'unconfirmed');
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});

  const handleShareWhatsapp = () => {
    const text = encodeURIComponent(
      `Alhamdulillah, kami sekeluarga telah dievakuasi dengan selamat di ${locationReached}. Kondisi kami aman dan telah melapor ke petugas posko. (Dikirim melalui Evacu8)`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyStatus = () => {
    const text = `Alhamdulillah, kami sekeluarga telah dievakuasi dengan selamat di ${locationReached}. Kondisi kami aman dan telah melapor ke petugas posko. (Dikirim melalui Evacu8)`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn pb-16">
      
      {/* 1. VISUAL STEPPER BREADCRUMB */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs font-extrabold pb-1">
          <div className="flex items-center gap-2 text-emerald-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              ✓
            </span>
            <span className="font-semibold text-slate-600">Input</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-emerald-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              ✓
            </span>
            <span className="font-semibold text-slate-600">Tinjau</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-emerald-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              ✓
            </span>
            <span className="font-semibold text-slate-600">Panduan</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-emerald-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              4
            </span>
            <span className="border-b-2 border-emerald-600 pb-0.5 text-emerald-800">Posko Aman</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER */}
      <div className="text-left space-y-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fase Penyelesaian Evakuasi</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Konfirmasi Keberadaan di Titik Aman
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          Konfirmasikan bahwa Anda dan keluarga telah tiba di fasilitas penampungan / posko evakuasi terverifikasi.
        </p>
      </div>

      {!confirmedSafe ? (
        /* Confirmation Action Card */
        <div className="p-6 sm:p-7 bg-white rounded-3xl border-2 border-blue-500/80 shadow-md space-y-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
            <ShieldCheck className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Apakah Anda & Keluarga Sudah Tiba di Posko?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Pastikan Anda telah bertemu petugas posko atau relawan lapangan dan berada di zona bebas bahaya susulan.
            </p>
          </div>

          {/* Family Check-in Mini Bar */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-left space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                Status Check-in Anggota Keluarga
              </span>
              <button 
                type="button" 
                onClick={() => onNavigateScreen('family')} 
                className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
              >
                Kelola Keluarga →
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-lg bg-emerald-100 text-emerald-950 px-2.5 py-0.5 border border-emerald-200">
                Aman: {familyCheckIns.safe || 0}
              </span>
              <span className="rounded-lg bg-rose-100 text-rose-950 px-2.5 py-0.5 border border-rose-200">
                Butuh Bantuan: {familyCheckIns.help || 0}
              </span>
              <span className="rounded-lg bg-amber-100 text-amber-950 px-2.5 py-0.5 border border-amber-200">
                Belum Diketahui: {familyCheckIns.unconfirmed || 0}
              </span>
            </div>
          </div>

          {/* Form Checkpoint */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Nama Posko / Lokasi Perlindungan Saat Ini:
              </label>
              <input
                type="text"
                value={locationReached}
                onChange={(e) => setLocationReached(e.target.value)}
                placeholder="Contoh: Balai Warga RW 04, SDN 01..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 font-semibold outline-none bg-white"
              />
            </div>

            <label className="flex items-center gap-2.5 pt-0.5 cursor-pointer">
              <input
                type="checkbox"
                checked={registeredWithOfficer}
                onChange={(e) => setRegisteredWithOfficer(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-semibold">
                Saya sudah melapor dan mencatat nama anggota keluarga ke meja absensi posko
              </span>
            </label>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={() => setConfirmedSafe(true)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base shadow-md shadow-emerald-900/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Ya, Kami Sudah Aman di Posko</span>
          </button>
        </div>
      ) : (
        /* Confirmed State - Post Evacuation Care */
        <div className="space-y-5 animate-fadeIn">
          
          {/* Fresh Light Success Banner */}
          <div className="p-6 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white rounded-3xl shadow-lg space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-black uppercase tracking-wider">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </div>
              <span>Status Keselamatan Terkonfirmasi</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">
                Alhamdulillah, Anda Telah di Tempat Aman
              </h2>
              <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-normal">
                Anda mengonfirmasi telah berada di <strong className="text-white">{locationReached}</strong>. Tetap bersama keluarga di area posko hingga situasi dinyatakan kondusif.
              </p>
            </div>

            {/* Quick Share Buttons */}
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleShareWhatsapp}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kabar Aman via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyStatus}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>
            </div>
          </div>

          {/* Post-Evacuation Checklist */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5">
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Daftar Tindakan Penting Pasca-Evakuasi di Posko:</span>
            </h3>

            <div className="space-y-2.5">
              <div 
                onClick={() => setRegisteredWithOfficer(!registeredWithOfficer)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  registeredWithOfficer ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  registeredWithOfficer ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {registeredWithOfficer && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs sm:text-sm text-slate-900">1. Registrasi di Meja Petugas Posko</p>
                  <p className="text-xs text-slate-500 mt-0.5">Catat nama keluarga di buku induk posko untuk alokasi logistik.</p>
                </div>
              </div>

              <div 
                onClick={() => setMedicalCheckDone(!medicalCheckDone)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  medicalCheckDone ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  medicalCheckDone ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {medicalCheckDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs sm:text-sm text-slate-900">2. Skrining di Tenda Medis</p>
                  <p className="text-xs text-slate-500 mt-0.5">Periksakan lansia, balita, atau yang kedinginan ke pos medis.</p>
                </div>
              </div>

              <div 
                onClick={() => setRationReceived(!rationReceived)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  rationReceived ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  rationReceived ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {rationReceived && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs sm:text-sm text-slate-900">3. Ambil Logistik & Air Bersih</p>
                  <p className="text-xs text-slate-500 mt-0.5">Dapatkan makanan siap saji, air higienis, dan selimut keluarga.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateScreen('posko')}
              className="p-3.5 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-2xs flex items-center gap-2.5 text-left transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-slate-900 truncate">Info Posko</p>
                <p className="text-[10px] text-slate-500 truncate">Logistik & tenda</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateScreen('family')}
              className="p-3.5 bg-white hover:bg-indigo-50/50 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-2xs flex items-center gap-2.5 text-left transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-slate-900 truncate">Status Keluarga</p>
                <p className="text-[10px] text-slate-500 truncate">Check-in kerabat</p>
              </div>
            </button>
          </div>

          {/* Official Verification Channels */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Kanal Informasi Resmi Bencana:</span>
            <div className="space-y-1.5">
              {OFFICIAL_SOURCES.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-xs">
                  <span className="font-semibold text-blue-900">{s.name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{s.update}</span>
                </div>
              ))}
            </div>
          </div>

          {/* End of Flow Action Button (Clean Royal Blue, No Dark Button) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onResetFlow}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all cursor-pointer shadow-md shadow-blue-600/25 active:scale-98"
            >
              <RotateCcw className="w-4 h-4 text-blue-200" />
              <span>Selesai & Kembali ke Beranda Siaga</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
