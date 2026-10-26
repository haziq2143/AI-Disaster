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
  Check
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
          Langkah 2 dari 4: Tinjau & Koreksi Input
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
          Periksa Data Sebelum Melihat Panduan Demo
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Pastikan transkrip dan detail kondisi akurat untuk mencegah rekomendasi yang salah.
        </p>
      </div>

      {/* Card 1: Review Transcribed / Typed Text */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider">
              Uraian Situasi Anda
            </span>
            <span className="text-[11px] px-2 py-0.5 bg-[#E3F2FD] text-[#0D47A1] font-semibold rounded-md">
              Kategori: {hazardObj.label}
            </span>
          </div>

          {!isEditing ? (
            <button
              onClick={() => {
                setEditedText(hazardData.description);
                setIsEditing(true);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#2196F3] hover:text-[#0D47A1] transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit / Koreksi Teks</span>
            </button>
          ) : (
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
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
              className="w-full p-3.5 rounded-xl border border-[#2196F3] ring-2 ring-[#90CAF9]/40 outline-none text-sm text-slate-800"
            />
            <p className="text-[11px] text-slate-400">Tekan simpan setelah mengoreksi kata atau rincian.</p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed italic">
            "{hazardData.description || 'Tidak ada uraian kondisi.'}"
          </div>
        )}

        {hazardData.location && (
          <div className="text-xs text-slate-600 flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Area Terdata:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{hazardData.location}</span>
          </div>
        )}
      </div>

      {/* Card 2: Focused Clarification Questions (PRD 4.2: Dibatasi pada info relevan & ada opsi 'Saya tidak tahu') */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#2196F3]" />
          <h3 className="font-bold text-slate-800 text-sm">
            Pertanyaan Klarifikasi Keselamatan Cepat
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Pertanyaan ini hanya ditinjau secara manual oleh Anda; aplikasi tidak menganalisis jawabannya.
        </p>

        <div className="space-y-4 pt-1">
          {/* Question 1 */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-800">
              1. Apakah saklar listrik utama rumah sudah dimatikan atau masih menyala?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'cut_off', label: 'Sudah Mati / Aman' },
                { val: 'still_on', label: 'Masih Menyala' },
                { val: 'dont_know', label: 'Saya Tidak Tahu' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setClarifications(prev => ({ ...prev, waterElectricity: opt.val }))}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    clarifications.waterElectricity === opt.val
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-[#90CAF9]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-800">
              2. Apakah ada anggota keluarga dengan keterbatasan mobilitas (lansia, sakit, balita)?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'yes', label: 'Ya, Ada' },
                { val: 'no', label: 'Tidak Ada (Semua Mandiri)' },
                { val: 'dont_know', label: 'Saya Tidak Tahu' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setClarifications(prev => ({ ...prev, hasVulnerable: opt.val }))}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    clarifications.hasVulnerable === opt.val
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-[#90CAF9]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-800">
              3. Apakah jalur keluar depan rumah masih dapat dilalui kaki secara aman?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'yes', label: 'Bisa Dilalui' },
                { val: 'partial', label: 'Sulit / Berisiko' },
                { val: 'dont_know', label: 'Saya Tidak Tahu' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setClarifications(prev => ({ ...prev, mobilitySafe: opt.val }))}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    clarifications.mobilitySafe === opt.val
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-[#90CAF9]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Safety Boundary Guarantee */}
      <div className="flex items-start gap-2.5 p-3.5 bg-[#E3F2FD] rounded-xl border border-[#90CAF9] text-xs text-[#0D47A1]">
        <ShieldCheck className="w-4 h-4 text-[#2196F3] shrink-0 mt-0.5" />
        <span>
          <strong>Batasan demo:</strong> Jawaban dan uraian Anda tidak dianalisis otomatis. Panduan berikut adalah skenario statis, bukan fakta lapangan atau rekomendasi resmi.
        </span>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="flex items-center gap-2 px-7 py-3 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#90CAF9]" />
          <span>Lihat Panduan Skenario</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
