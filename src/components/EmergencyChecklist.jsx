import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  HelpCircle,
  PackageCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { INITIAL_CHECKLIST } from '../data/mockData';

export default function EmergencyChecklist({ 
  hazardData, 
  onBack, 
  onNavigateScreen 
}) {
  const [items, setItems] = useState(INITIAL_CHECKLIST);
  const [activeCategory, setActiveCategory] = useState('Semua');

  const handleToggle = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  const categories = ['Semua', 'Dokumen', 'Kesehatan', 'Pangan & Air', 'Peralatan', 'Sandang'];

  const filteredItems = activeCategory === 'Semua' 
    ? items 
    : items.filter(it => it.category === activeCategory);

  const completedCount = items.filter(it => it.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
            Screen 09: Emergency Checklist
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Tas Siaga Bencana (Quick Checklist)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Disesuaikan dengan kebutuhan anggota keluarga dan kategori ancaman saat ini.
          </p>
        </div>
      </div>

      {/* Safety Notice Warning (PRD 4.7 & 12.2: Checklist bukan alasan kembali ke area bahaya!) */}
      <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-extrabold uppercase tracking-wide text-amber-900">
            Peringatan Keselamatan Nyawa (PRD 4.7):
          </p>
          <p className="leading-relaxed font-medium">
            Ambil hanya barang yang sudah siap diraih dalam 1–2 menit. <strong>DILARANG KERAS kembali masuk ke area berbahaya atau lantai bawah yang terendam demi mengambil barang.</strong>
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">Kesiapan Barang Bawaan:</span>
          <span className="font-mono font-bold text-[#0D47A1]">{completedCount} dari {items.length} Barang Siap ({progressPercent}%)</span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div 
            className="h-full bg-gradient-to-r from-[#2196F3] to-[#0D47A1] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400 italic">
          *Catatan UX: Status 100% selesai bukan jaminan bahwa situasi telah sepenuhnya aman tanpa instruksi petugas.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeCategory === cat
                ? 'bg-[#0D47A1] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-[#90CAF9]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Checklist Items List */}
      <div className="space-y-2.5">
        {filteredItems.map(item => {
          return (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                item.completed
                  ? 'bg-emerald-50/40 border-emerald-300 text-slate-700'
                  : 'bg-white border-slate-200 hover:border-[#2196F3]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.completed ? (
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-[#2196F3]"></div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.label}
                  </span>
                  {item.essential && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded">
                      ESENSIAL
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{item.category}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
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
          onClick={() => onNavigateScreen('confirm_safe')}
          className="flex items-center gap-2 px-6 py-3 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <span>Lanjut ke Konfirmasi Posko Aman</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
