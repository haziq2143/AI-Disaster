'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  Edit3, 
  ArrowRight, 
  ArrowLeft, 
  HelpCircle, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck,
  Eye,
  Check,
  MapPin,
  Zap,
  Users,
  DoorOpen,
  Waves,
  Activity,
  Flame,
  Mountain
} from 'lucide-react';
import { HAZARD_TYPES } from '../data/mockData';

export default function ReviewInput({ 
  hazardData, 
  setHazardData, 
  onNext, 
  onBack 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(hazardData.description || '');

  // Clarification questions as mandated by PRD 4.2 & Screen 04
  const [clarifications, setClarifications] = useState({
    waterElectricity: hazardData.waterElectricity || 'dont_know', // 'cut_off', 'still_on', 'dont_know'
    hasVulnerable: hazardData.hasVulnerable || 'yes', // 'yes', 'no', 'dont_know'
    mobilitySafe: hazardData.mobilitySafe || 'partial' // 'yes', 'blocked', 'partial', 'dont_know'
  });

  const hazardObj = HAZARD_TYPES.find(h => h.id === hazardData.type) || HAZARD_TYPES[0];

  const handleSaveEdit = () => {
    setHazardData(prev => ({ ...prev, description: editedText }));
    setIsEditing(false);
  };

  const handleProceed = () => {
    setHazardData(prev => ({
      ...prev,
      description: editedText,
      clarifications: clarifications
    }));
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* 1. VISUAL STEPPER BREADCRUMB */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs font-extrabold pb-1">
          <div className="flex items-center gap-2 text-emerald-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              ✓
            </span>
            <span className="font-semibold text-slate-600">Input Selesai</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-blue-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              2
            </span>
            <span className="border-b-2 border-blue-600 pb-0.5">Tinjau & Klarifikasi</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">
              3
            </span>
            <span>Analisis AI</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">
              4
            </span>
            <span>Panduan Siaga</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER TITLE */}
      <div className="text-left space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Verifikasi Keselamatan Warga</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Periksa Data & Lengkapi Klarifikasi Cepat
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
          Memastikan rincian kondisi akurat dan menjawab 3 pertanyaan kunci keselamatan akan memandu sistem menyusun rute teraman serta memprioritaskan bantuan.
        </p>
      </div>

      {/* 3. CARD 1: REVIEW TRANSCRIBED / TYPED SITUATION */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Uraian Situasi Anda
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 bg-blue-50 text-blue-800 font-extrabold rounded-lg border border-blue-200">
              Kategori: {hazardObj.label}
            </span>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setEditedText(hazardData.description);
                setIsEditing(true);
              }}
              className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer px-3 py-1.5 rounded-xl hover:bg-blue-50"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit / Koreksi Teks</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Simpan Perubahan</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
              className="w-full p-4 rounded-2xl border-2 border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 bg-white leading-relaxed shadow-inner"
            />
            <p className="text-[11px] text-slate-400 font-medium">
              Tekan tombol hijau "Simpan Perubahan" di atas setelah mengoreksi kata atau rincian.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-slate-800 text-xs sm:text-sm leading-relaxed italic relative">
            <span className="text-2xl text-blue-300 font-serif leading-none select-none block -mb-2">“</span>
            <p className="font-medium text-slate-800 pl-2">
              {hazardData.description || 'Tidak ada uraian kondisi.'}
            </p>
            <span className="text-2xl text-blue-300 font-serif leading-none select-none block text-right -mt-2">”</span>
          </div>
        )}

        {hazardData.location && (
          <div className="text-xs text-slate-600 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Lokasi Kejadian Terdata:
            </span>
            <span className="bg-slate-100 px-3 py-1 rounded-xl text-slate-800 font-bold border border-slate-200">
              {hazardData.location}
            </span>
          </div>
        )}
      </div>

      {/* 4. CARD 2: FOCUSED CLARIFICATION QUESTIONS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>3 Pertanyaan Kunci Keselamatan Lapangan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pilih opsi yang paling mendekati kondisi nyata Anda saat ini untuk menyesuaikan instruksi keselamatan.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Question 1: Listrik */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs font-extrabold text-slate-900">
                1. Apakah sakelar meteran MCB listrik utama sudah dimatikan atau masih menyala?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: 'cut_off', label: 'Sudah Padam / Aman', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
                { val: 'still_on', label: 'Masih Menyala', activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm' },
                { val: 'dont_know', label: 'Belum Cek / Tidak Tahu', activeClass: 'bg-slate-700 text-white border-slate-700 shadow-sm' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setClarifications(prev => ({ ...prev, waterElectricity: opt.val }))}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    clarifications.waterElectricity === opt.val
                      ? opt.activeClass
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Anggota Rentan */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <Users className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-xs font-extrabold text-slate-900">
                2. Apakah ada anggota keluarga dengan keterbatasan mobilitas (lansia, balita, sakit)?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: 'yes', label: 'Ya, Ada Anggota Rentan', activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm' },
                { val: 'no', label: 'Tidak Ada (Semua Mandiri)', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
                { val: 'dont_know', label: 'Ragu / Belum Terdata', activeClass: 'bg-slate-700 text-white border-slate-700 shadow-sm' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setClarifications(prev => ({ ...prev, hasVulnerable: opt.val }))}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    clarifications.hasVulnerable === opt.val
                      ? opt.activeClass
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Akses Keluar */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <DoorOpen className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-extrabold text-slate-900">
                3. Apakah jalur evakuasi keluar depan rumah masih dapat dilalui secara aman?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: 'yes', label: 'Bisa Dilalui Bebas', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
                { val: 'partial', label: 'Sulit / Berisiko Terjebak', activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm' },
                { val: 'dont_know', label: 'Belum Dicek Keluar', activeClass: 'bg-slate-700 text-white border-slate-700 shadow-sm' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setClarifications(prev => ({ ...prev, mobilitySafe: opt.val }))}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    clarifications.mobilitySafe === opt.val
                      ? opt.activeClass
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRIVACY & SAFETY BOUNDARY GUARANTEE */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-950 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Keamanan Data Terjaga:</strong> Seluruh informasi yang Anda masukkan digunakan semata-mata untuk mengelompokkan prioritas keselamatan darurat dan merancang panduan evakuasi 1-langkah.
        </span>
      </div>

      {/* 6. BOTTOM ACTION FOOTER */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Input</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-blue-200" />
          <span>Lanjutkan ke Analisis AI</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
