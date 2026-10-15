import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  Home, 
  PhoneCall, 
  ExternalLink, 
  AlertCircle, 
  FileText,
  Clock,
  Sparkles
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
  const [registeredWithOfficer, setRegisteredWithOfficer] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
          Screen 10: Safe Confirmation & Next Steps
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
          Konfirmasi Keberadaan di Titik Aman
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Sesuai PRD 4.8 & 12.2: Status 'Aman' merupakan konfirmasi sadar dari Anda, bukan deteksi otomatis.
        </p>
      </div>

      {!confirmedSafe ? (
        /* Confirmation Action Card */
        <div className="p-6 sm:p-8 bg-white rounded-3xl border-2 border-[#2196F3] shadow-lg space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center mx-auto border border-[#90CAF9]">
            <ShieldCheck className="w-8 h-8 text-[#2196F3]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Apakah Anda & Keluarga Sudah Tiba di Posko Aman?
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Pastikan Anda telah bertemu petugas atau relawan lapangan dan berada di zona aman bebas risiko bencana susulan.
            </p>
          </div>

          {/* Form checkpoint */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Lokasi Perlindungan Saat Ini:
              </label>
              <input
                type="text"
                value={locationReached}
                onChange={(e) => setLocationReached(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2196F3] text-sm text-slate-800 outline-none bg-white"
              />
            </div>

            <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={registeredWithOfficer}
                onChange={(e) => setRegisteredWithOfficer(e.target.checked)}
                className="w-4 h-4 text-[#0D47A1] rounded border-slate-300 focus:ring-[#2196F3]"
              />
              <span className="text-xs text-slate-700 font-medium">
                Saya sudah melapor nama keluarga ke meja absensi petugas posko
              </span>
            </label>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={() => setConfirmedSafe(true)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-emerald-900/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Ya, Kami Sudah di Tempat Aman</span>
          </button>
        </div>
      ) : (
        /* Confirmed State - Post Evacuation Care */
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Status Terkonfirmasi Mandiri</span>
            </div>
            <h3 className="text-2xl font-extrabold">
              Alhamdulillah, Anda Telah di Tempat Aman
            </h3>
            <p className="text-sm text-emerald-100 leading-relaxed font-normal">
              Lokasi: <strong>{locationReached}</strong>. Tetap bersama keluarga dan jangan kembali ke rumah sampai petugas resmi BPBD menyatakan status bencana dicabut.
            </p>
          </div>

          {/* Step Follow-ups (PRD 4.8 Langkah lanjutan yang relevan) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2196F3]" />
              <span>Langkah Pasca-Evakuasi yang Perlu Dilakukan:</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0D47A1] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-bold text-slate-800">Cek Kesehatan Fisik Anggota</p>
                  <p className="text-slate-500 mt-0.5">Segera datangi tenda medis posko jika ada anggota yang terluka, kedinginan hipotermia, atau kehabisan obat penting.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0D47A1] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-bold text-slate-800">Hemat Baterai Ponsel</p>
                  <p className="text-slate-500 mt-0.5">Aktifkan mode Ultra Power Saving. Beri kabar singkat satu kali kepada kerabat jauh bahwa Anda selamat di posko.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0D47A1] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-bold text-slate-800">Pantau Perkembangan dari Sumber Resmi</p>
                  <p className="text-slate-500 mt-0.5">Jangan termakan hoaks isu tanggul jebol/isu liar. Percayakan hanya pada pengumuman pengeras suara posko & BMKG.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Official Verification Channels */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Kanal Peringatan Resmi Aktif</span>
              <span className="text-[11px] text-slate-400">Verifikasi Terakhir</span>
            </div>
            <div className="space-y-2">
              {OFFICIAL_SOURCES.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-[#E3F2FD]/50 rounded-xl text-xs">
                  <span className="font-semibold text-[#0D47A1]">{s.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{s.update}</span>
                </div>
              ))}
            </div>
          </div>

          {/* End of Flow Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onResetFlow}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Selesai Demo & Kembali ke Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
