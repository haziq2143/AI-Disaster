import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Heart, 
  Trash2, 
  ArrowLeft, 
  ShieldCheck, 
  UserCheck, 
  HelpCircle,
  Plus
} from 'lucide-react';
import { INITIAL_FAMILY } from '../data/mockData';

export default function FamilySafety({ 
  familyMembers, 
  setFamilyMembers, 
  onBack,
  onNavigateScreen 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('Anggota Keluarga');
  const [newNeeds, setNewNeeds] = useState('');

  const handleToggleStatus = (id) => {
    setFamilyMembers(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: m.status === 'together' ? 'unconfirmed' : 'together'
        };
      }
      return m;
    }));
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember = {
      id: 'f-' + Date.now(),
      name: newName,
      relationship: newRelationship,
      supportNeeds: newNeeds.trim() || 'Tidak ada kebutuhan khusus tercatat',
      status: 'together'
    };

    setFamilyMembers(prev => [...prev, newMember]);
    setNewName('');
    setNewNeeds('');
    setShowAddModal(false);
  };

  const handleDeleteMember = (id) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  const togetherCount = familyMembers.filter(m => m.status === 'together').length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
            Screen 07: Family Safety
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Pemantauan Keselamatan Keluarga
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola kebutuhan khusus pendampingan secara manual tanpa ketergantungan sinyal GPS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D47A1] hover:bg-[#1565C0] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Anggota</span>
        </button>
      </div>

      {/* Summary Tracker Pill */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Status Pendampingan</p>
            <p className="text-sm font-bold text-slate-900">
              {togetherCount} dari {familyMembers.length} Anggota Sudah Bersama Anda
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          togetherCount === familyMembers.length 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-amber-100 text-amber-900'
        }`}>
          {togetherCount === familyMembers.length ? 'Semua Terkumpul' : 'Ada yang Belum'}
        </span>
      </div>

      {/* List of Family Members */}
      <div className="space-y-3">
        {familyMembers.map((member) => {
          const isTogether = member.status === 'together';
          return (
            <div
              key={member.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all bg-white ${
                isTogether 
                  ? 'border-emerald-200 shadow-xs ring-1 ring-emerald-100' 
                  : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    isTogether ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{member.name}</h4>
                      <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                        {member.relationship}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-0.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="font-medium text-slate-700">Kebutuhan Bantuan:</span>
                      <span className="text-slate-600">{member.supportNeeds}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(member.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isTogether
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isTogether ? 'Sudah Bersama' : 'Belum Konfirmasi'}</span>
                  </button>

                  {member.id !== 'f1' && (
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus anggota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal Inline */}
      {showAddModal && (
        <div className="p-5 bg-white rounded-2xl border-2 border-[#2196F3] shadow-lg space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#2196F3]" />
              Tambah Profil Anggota Keluarga
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleAddMember} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Anggota:</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Misal: Kakek Joko / Bayi Kirana"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#2196F3] text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Hubungan / Peran:</label>
              <select
                value={newRelationship}
                onChange={(e) => setNewRelationship(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#2196F3] text-sm outline-none bg-white"
              >
                <option value="Orang Tua / Lansia">Orang Tua / Lansia</option>
                <option value="Anak / Balita">Anak / Balita</option>
                <option value="Pasangan">Pasangan</option>
                <option value="Kerabat / Tetangga">Kerabat / Tetangga</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Kebutuhan Bantuan Khusus (Opsional):</label>
              <input
                type="text"
                value={newNeeds}
                onChange={(e) => setNewNeeds(e.target.value)}
                placeholder="Misal: Perlu tongkat, obat insulin harian, tidak bisa lari cepat"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#2196F3] text-sm outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan Anggota
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Privacy Notice Card (PRD 4.5 & 4.10) */}
      <div className="p-4 bg-[#E3F2FD] rounded-2xl border border-[#90CAF9] text-xs text-[#0D47A1] space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-[#2196F3]" />
          <span>Kebijakan Privasi & Tanpa Pelacakan GPS Otomatis (PRD 4.5):</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Platform tidak mengakses satelit lokasi anggota tanpa persetujuan, dan tidak menyebarkan kontak ke pihak luar. Status keberadaan diperbarui murni secara manual oleh pendamping keluarga.
        </p>
      </div>

      {/* Navigation */}
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
          onClick={() => onNavigateScreen('route')}
          className="flex items-center gap-2 px-6 py-3 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <span>Lanjut ke Peta & Rute Evakuasi</span>
        </button>
      </div>
    </div>
  );
}
