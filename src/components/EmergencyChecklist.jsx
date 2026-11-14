import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Calculator,
  CheckSquare,
  Users,
  Plus,
  Check,
  Droplet,
  Package,
  Heart,
  Baby,
  Sparkles
} from 'lucide-react';
import { INITIAL_CHECKLIST } from '../data/mockData';

export default function EmergencyChecklist({ 
  items: savedItems = INITIAL_CHECKLIST,
  setItems,
  onBack, 
  onNavigateScreen 
}) {
  const items = savedItems;
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' | 'calculator'
  const [activeCategory, setActiveCategory] = useState('Semua');

  // State Kalkulator 72 Jam
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [elderly, setElderly] = useState(0);
  const [pets, setPets] = useState(0);
  const [days, setDays] = useState(3);
  const [itemsAddedFeedback, setItemsAddedFeedback] = useState('');

  // Perhitungan Logistik Standar BNPB & FEMA
  const totalWaterLiters = ((adults * 3) + (elderly * 3) + (children * 2) + (pets * 1)) * days;
  const totalMealPortions = ((adults * 3) + (elderly * 3) + (children * 3)) * days;
  const totalDiapers = children * 6 * days;

  const handleApplyCalculatedItems = () => {
    const newItems = [
      {
        id: 'calc-water',
        label: `Air Bersih Minum & Sanitasi: ${totalWaterLiters} Liter (${days} hari untuk ${adults + children + elderly} orang)`,
        category: 'Pangan & Air',
        essential: true,
        completed: false
      },
      {
        id: 'calc-food',
        label: `Makanan Siap Saji/Kaleng: ${totalMealPortions} Porsi (${days} hari)`,
        category: 'Pangan & Air',
        essential: true,
        completed: false
      }
    ];

    if (children > 0) {
      newItems.push({
        id: 'calc-baby',
        label: `Perlengkapan Bayi: ${totalDiapers} pcs popok, susu formula, & botol steril`,
        category: 'Kesehatan',
        essential: true,
        completed: false
      });
    }

    if (elderly > 0) {
      newItems.push({
        id: 'calc-elderly',
        label: `Obat Resep Lansia (Hipertensi/Diabetes/Jantung) untuk minimal 7 hari & baterai cadangan alat bantu`,
        category: 'Kesehatan',
        essential: true,
        completed: false
      });
    }

    if (pets > 0) {
      newItems.push({
        id: 'calc-pet',
        label: `Makanan & Tempat Minum Hewan Peliharaan untuk ${days} hari`,
        category: 'Pangan & Air',
        essential: false,
        completed: false
      });
    }

    setItems(prev => {
      // Hilangkan item kalkulasi lama jika sudah ada, ganti dengan yang baru
      const filtered = prev.filter(it => !it.id.startsWith('calc-'));
      return [...filtered, ...newItems];
    });

    setItemsAddedFeedback('Item kebutuhan 72 jam berhasil ditambahkan ke Daftar Periksa!');
    setTimeout(() => {
      setItemsAddedFeedback('');
      setActiveTab('checklist');
    }, 1500);
  };

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
            Screen 09: Kesiapsiagaan Darurat
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Tas Siaga Bencana & Logistik 72 Jam
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Disesuaikan dengan jumlah anggota keluarga untuk bertahan 72 jam pertama mandiri.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-white text-[#0D47A1] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Daftar Periksa Barang</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'calculator'
              ? 'bg-[#0D47A1] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Kalkulator Kebutuhan 72 Jam</span>
        </button>
      </div>

      {activeTab === 'calculator' ? (
        <div className="space-y-5 animate-fadeIn">
          {/* Family Composition Parameters Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Users className="w-4 h-4 text-[#2196F3]" />
              <span>Komposisi Keluarga & Durasi Mandiri</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Dewasa */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Dewasa</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-base text-[#0D47A1] min-w-5">{adults}</span>
                  <button
                    type="button"
                    onClick={() => setAdults(adults + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Anak */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Anak/Balita</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-base text-[#0D47A1] min-w-5">{children}</span>
                  <button
                    type="button"
                    onClick={() => setChildren(children + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lansia */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Lansia</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setElderly(Math.max(0, elderly - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-base text-[#0D47A1] min-w-5">{elderly}</span>
                  <button
                    type="button"
                    onClick={() => setElderly(elderly + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Hewan */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Hewan Piaraan</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPets(Math.max(0, pets - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-base text-[#0D47A1] min-w-5">{pets}</span>
                  <button
                    type="button"
                    onClick={() => setPets(pets + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100">
              <span>Target Durasi Bertahan Mandiri:</span>
              <span className="font-bold text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-lg">
                {days} Hari (72 Jam Pertama Standar BNPB)
              </span>
            </div>
          </div>

          {/* Calculation Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Air Minum */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-[#0D47A1] font-bold text-xs">
                <Droplet className="w-4 h-4 text-blue-600" />
                <span>Air Bersih Siap Minum</span>
              </div>
              <div className="text-2xl font-black text-[#0D47A1]">
                {totalWaterLiters} <span className="text-sm font-semibold text-slate-600">Liter</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Standar 3L/hari/dewasa (minum & hidrasi darurat) untuk {days} hari.
              </p>
            </div>

            {/* Makanan / Kalori */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Package className="w-4 h-4 text-amber-700" />
                <span>Ransum & Makanan Kaleng</span>
              </div>
              <div className="text-2xl font-black text-amber-950">
                {totalMealPortions} <span className="text-sm font-semibold text-slate-600">Porsi Kaleng / Paket</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Makanan siap makan berenergi tinggi yang tidak memerlukan kompor/pemanas.
              </p>
            </div>

            {/* Kebutuhan Khusus Balita */}
            {children > 0 && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <Baby className="w-4 h-4 text-emerald-700" />
                  <span>Kebutuhan Balita / Anak</span>
                </div>
                <div className="text-xl font-black text-emerald-950">
                  {totalDiapers} <span className="text-sm font-semibold text-slate-600">Pcs Popok</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Plus susu formula tahan basi, botol steril, dan 3 stel pakaian ganti per anak.
                </p>
              </div>
            )}

            {/* Kebutuhan Lansia */}
            {elderly > 0 && (
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <Heart className="w-4 h-4 text-rose-700" />
                  <span>Kebutuhan Medis Lansia</span>
                </div>
                <div className="text-sm font-extrabold text-rose-950">
                  Obat Resep Rutin Min. 7 Hari
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Termasuk salinan resep, cadangan kacamata/baterai alat bantu dengar, & selimut hangat.
                </p>
              </div>
            )}
          </div>

          {itemsAddedFeedback && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{itemsAddedFeedback}</span>
            </div>
          )}

          {/* Action to merge into checklist */}
          <button
            type="button"
            onClick={handleApplyCalculatedItems}
            className="w-full py-4 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Terapkan Hasil Kalkulasi ke Daftar Periksa Pribadi</span>
          </button>
        </div>
      ) : (
        <>
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

            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs leading-relaxed text-blue-950">
              Checklist ini tersimpan di penyimpanan lokal browser pada perangkat ini. Browser dapat menghapus penyimpanan situs; catat kebutuhan penting secara terpisah bila perlu.
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
                <label
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    item.completed
                      ? 'bg-emerald-50/40 border-emerald-300 text-slate-700'
                      : 'bg-white border-slate-200 hover:border-[#2196F3]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggle(item.id)}
                    className="mt-1 h-5 w-5 shrink-0 accent-emerald-600"
                    aria-label={item.label}
                  />

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
                </label>
              );
            })}
          </div>
        </>
      )}

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
