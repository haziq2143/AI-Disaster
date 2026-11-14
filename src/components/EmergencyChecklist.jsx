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
  Sparkles,
  Trash2,
  FileText,
  HeartPulse,
  Utensils,
  Wrench,
  Shirt,
  Shield,
  HelpCircle,
  RotateCcw,
  CheckCheck,
  Info,
  Luggage,
  Flame,
  Waves,
  Activity,
  Layers,
  X,
  Navigation
} from 'lucide-react';
import { INITIAL_CHECKLIST } from '../data/mockData';

export default function EmergencyChecklist({ 
  items: savedItems = INITIAL_CHECKLIST,
  setItems,
  onBack, 
  onNavigateScreen 
}) {
  const items = savedItems || INITIAL_CHECKLIST;
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' | 'calculator' | 'packing_tips'
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [selectedDisasterPreset, setSelectedDisasterPreset] = useState('all'); // 'all' | 'banjir' | 'gempa' | 'kebakaran'
  
  // State Modal Tambah Barang Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Peralatan');
  const [newItemEssential, setNewItemEssential] = useState(false);

  // State Kalkulator 72 Jam
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [elderly, setElderly] = useState(0);
  const [pets, setPets] = useState(0);
  const [days, setDays] = useState(3);
  const [toastFeedback, setToastFeedback] = useState('');

  // Perhitungan Logistik Standar BNPB & FEMA
  const totalWaterLiters = ((adults * 3) + (elderly * 3) + (children * 2) + (pets * 1)) * days;
  const totalMealPortions = ((adults * 3) + (elderly * 3) + (children * 3)) * days;
  const totalDiapers = children * 6 * days;

  const showToast = (msg) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(''), 3500);
  };

  const handleToggle = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  const handleToggleAll = (markAsCompleted) => {
    setItems(prev => prev.map(item => ({ ...item, completed: markAsCompleted })));
    showToast(markAsCompleted ? 'Semua barang ditandai siap!' : 'Status checklist telah di-reset.');
  };

  const handleResetToDefault = () => {
    if (typeof window !== 'undefined' && window.confirm('Kembalikan daftar periksa ke rekomendasi standar BNPB?')) {
      setItems(INITIAL_CHECKLIST);
      showToast('Daftar periksa dikembalikan ke standar BNPB.');
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemLabel.trim()) return;

    const newItem = {
      id: `custom-${Date.now()}`,
      label: newItemLabel.trim(),
      category: newItemCategory,
      essential: newItemEssential,
      completed: false,
      isCustom: true
    };

    setItems(prev => [newItem, ...prev]);
    setNewItemLabel('');
    setShowAddModal(false);
    showToast('Barang tambahan berhasil dimasukkan ke daftar.');
  };

  const handleDeleteItem = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
    showToast('Barang berhasil dihapus dari daftar.');
  };

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
      return [...newItems, ...filtered];
    });

    showToast('Item kebutuhan 72 jam berhasil ditambahkan ke Daftar Periksa!');
    setActiveTab('checklist');
  };

  // Filter Presets & Categories
  const categories = [
    { label: 'Semua', icon: Layers },
    { label: 'Dokumen', icon: FileText },
    { label: 'Kesehatan', icon: HeartPulse },
    { label: 'Pangan & Air', icon: Utensils },
    { label: 'Peralatan', icon: Wrench },
    { label: 'Sandang', icon: Shirt },
    { label: 'Keselamatan', icon: Shield }
  ];

  const filteredItems = items.filter(it => {
    // Filter Category
    if (activeCategory !== 'Semua' && it.category !== activeCategory) {
      return false;
    }
    // Filter Preset Bencana
    if (selectedDisasterPreset === 'banjir') {
      return it.category === 'Dokumen' || it.category === 'Pangan & Air' || it.category === 'Sandang' || it.label.toLowerCase().includes('kedap air');
    }
    if (selectedDisasterPreset === 'gempa') {
      return it.category === 'Peralatan' || it.category === 'Kesehatan' || it.category === 'Keselamatan' || it.essential;
    }
    if (selectedDisasterPreset === 'kebakaran') {
      return it.category === 'Kesehatan' || it.category === 'Dokumen' || it.label.toLowerCase().includes('masker') || it.essential;
    }
    return true;
  });

  const completedCount = items.filter(it => it.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const essentialItems = items.filter(it => it.essential);
  const completedEssentialCount = essentialItems.filter(it => it.completed).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Toast Feedback */}
      {toastFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* Modern Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80">
              <Luggage className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
              Kesiapsiagaan Mandiri
            </span>
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">•</span>
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Offline Ready</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tas Siaga Bencana & Logistik 72 Jam
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Panduan barang esensial standar BNPB & FEMA untuk bertahan mandiri 72 jam pertama saat evakuasi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Kesiapan */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tingkat Kesiapan</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{progressPercent}%</span>
              <span className="text-xs font-semibold text-slate-500">({completedCount}/{items.length} siap)</span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Barang Esensial Kritis */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Barang Esensial</span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {completedEssentialCount}/{essentialItems.length}
              </span>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                completedEssentialCount === essentialItems.length
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {completedEssentialCount === essentialItems.length ? 'Lengkap' : 'Belum Lengkap'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Barang vital nyawa, dokumen & obat
            </p>
          </div>
        </div>

        {/* Card 3: Standar Durasi & Bobot */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Standar Durasi</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Luggage className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 tracking-tight">72 Jam</span>
              <span className="text-xs font-semibold text-slate-500">(3 Hari Mandiri)</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Beban ideal tas: max 10-15% BB
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Daftar Periksa Barang</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'calculator'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Kalkulator 72 Jam</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('packing_tips')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'packing_tips'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Tips & Ergonomi</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR PERIKSA BARANG */}
      {activeTab === 'checklist' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Skenario Cepat Bencana Filter Chips */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Filter Skenario Bencana:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAll(true)}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                >
                  Tandai Semua Siap
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => handleToggleAll(false)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {[
                { id: 'all', label: 'Semua Standar BNPB', icon: Layers },
                { id: 'banjir', label: 'Khusus Banjir', icon: Waves },
                { id: 'gempa', label: 'Khusus Gempa', icon: Activity },
                { id: 'kebakaran', label: 'Khusus Kebakaran', icon: Flame }
              ].map(preset => {
                const PresetIcon = preset.icon;
                const isSelected = selectedDisasterPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedDisasterPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <PresetIcon className="w-3.5 h-3.5" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => {
              const CatIcon = cat.icon;
              const isSelected = activeCategory === cat.label;
              const count = cat.label === 'Semua' 
                ? items.length 
                : items.filter(it => it.category === cat.label).length;

              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setActiveCategory(cat.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Safety Rule Warning Banner */}
          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-300/80 text-amber-950 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <p className="font-extrabold uppercase tracking-wide text-amber-900">
                Prinsip Keselamatan Nyawa (BNPB):
              </p>
              <p className="leading-relaxed text-amber-900/90 font-medium">
                Ambil tas siaga hanya jika sudah berada di dekat Anda dan dapat diraih dalam 1–2 menit. <strong>DILARANG KERAS kembali masuk ke rumah retak atau lantai yang tergenang air demi mengambil barang.</strong>
              </p>
            </div>
          </div>

          {/* Checklist Items List */}
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700">Tidak ada barang dalam kategori ini.</p>
                <button
                  type="button"
                  onClick={() => { setActiveCategory('Semua'); setSelectedDisasterPreset('all'); }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Tampilkan Semua Kategori
                </button>
              </div>
            ) : (
              filteredItems.map(item => {
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggle(item.id)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                      item.completed
                        ? 'bg-emerald-50/40 border-emerald-300/80 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        item.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 group-hover:border-blue-500 bg-white'
                      }`}>
                        {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs sm:text-sm font-bold leading-snug transition-all ${
                            item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}>
                            {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                            {item.category}
                          </span>
                          {item.essential && (
                            <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-[10px] font-black uppercase tracking-wider">
                              Esensial
                            </span>
                          )}
                          {item.isCustom && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">
                              Kustom
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Custom Item Button */}
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Hapus barang ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Celebration Card When 100% Prepared */}
          {progressPercent === 100 && items.length > 0 && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 flex items-center gap-3 animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="font-black text-sm text-emerald-900">Tas Siaga Lengkap & Siap!</p>
                <p className="text-emerald-800">
                  Seluruh barang telah disiapkan. Letakkan tas di dekat pintu keluar agar dapat langsung dibawa saat kondisi darurat.
                </p>
              </div>
            </div>
          )}

          {/* Reset to Default Standard Action */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke Rekomendasi Standar BNPB</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: KALKULATOR KEBUTUHAN 72 JAM */}
      {activeTab === 'calculator' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Family Composition Parameters Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Komposisi Anggota Keluarga</span>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Total: {adults + children + elderly} Jiwa {pets > 0 ? `+ ${pets} Hewan` : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Dewasa */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Dewasa</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-black text-lg text-slate-900 min-w-5">{adults}</span>
                  <button
                    type="button"
                    onClick={() => setAdults(adults + 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Anak / Balita */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Anak / Balita</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-black text-lg text-slate-900 min-w-5">{children}</span>
                  <button
                    type="button"
                    onClick={() => setChildren(children + 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lansia */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Lansia</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setElderly(Math.max(0, elderly - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-black text-lg text-slate-900 min-w-5">{elderly}</span>
                  <button
                    type="button"
                    onClick={() => setElderly(elderly + 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Hewan Piaraan */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Hewan Peliharaan</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPets(Math.max(0, pets - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-black text-lg text-slate-900 min-w-5">{pets}</span>
                  <button
                    type="button"
                    onClick={() => setPets(pets + 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Stepper Durasi Hari */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-blue-950 block">Target Durasi Mandiri:</span>
                <span className="text-[11px] text-blue-800">Standar evakuasi darurat sebelum logistik bantuan tiba</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDays(Math.max(1, days - 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-blue-300 font-bold text-blue-900 flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="font-black text-sm text-blue-950 px-2">{days} Hari</span>
                <button
                  type="button"
                  onClick={() => setDays(Math.min(7, days + 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-blue-300 font-bold text-blue-900 flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Calculation Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Air Bersih Minum */}
            <div className="p-4 bg-white rounded-3xl border border-blue-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                    <Droplet className="w-4 h-4" />
                  </span>
                  <span>Kebutuhan Air Bersih</span>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  Minum & Higienitas
                </span>
              </div>
              <div className="text-3xl font-black text-blue-900 tracking-tight">
                {totalWaterLiters} <span className="text-sm font-bold text-slate-500">Liter</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Standar 3L/hari/dewasa (minum 2L + hidrasi/kebersihan darurat 1L) untuk durasi {days} hari.
              </p>
            </div>

            {/* Makanan / Kalori */}
            <div className="p-4 bg-white rounded-3xl border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                  <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
                    <Package className="w-4 h-4" />
                  </span>
                  <span>Ransum Siap Makan</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                  Tinggi Kalori
                </span>
              </div>
              <div className="text-3xl font-black text-amber-950 tracking-tight">
                {totalMealPortions} <span className="text-sm font-bold text-slate-500">Porsi Kaleng / Paket</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Biskuit padat energi, makanan kaleng tanpa kompor, kurma, abon, dan cokelat berenergi.
              </p>
            </div>

            {/* Kebutuhan Khusus Balita */}
            {children > 0 && (
              <div className="p-4 bg-white rounded-3xl border border-emerald-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                    <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                      <Baby className="w-4 h-4" />
                    </span>
                    <span>Perlengkapan Balita</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Khusus Anak
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-950">
                  {totalDiapers} <span className="text-sm font-bold text-slate-500">Pcs Popok</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Susu formula tahan lama, botol steril siap pakai, bubur instan, dan 3 stel baju ganti hangat.
                </p>
              </div>
            )}

            {/* Kebutuhan Lansia */}
            {elderly > 0 && (
              <div className="p-4 bg-white rounded-3xl border border-rose-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-950 font-bold text-xs">
                    <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
                      <Heart className="w-4 h-4" />
                    </span>
                    <span>Kebutuhan Lansia</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md">
                    Medis Rutin
                  </span>
                </div>
                <div className="text-xl font-black text-rose-950">
                  Obat Resep Min. 7 Hari
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Salinan resep dokter, obat tensi/gula/jantung, kacamata cadangan, dan selimut termal.
                </p>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleApplyCalculatedItems}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Terapkan Hasil Kalkulasi ke Daftar Periksa Pribadi</span>
          </button>
        </div>
      )}

      {/* TAB 3: PANDUAN PACKING & ERGONOMI TAS */}
      {activeTab === 'packing_tips' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b pb-3">
              <Luggage className="w-4 h-4 text-blue-600" />
              <span>Aturan Emas Penataan Tas Siaga (Standar BNPB & SAR)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tip 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Prinsip Beban Ergonomis 10-15%
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Berat total tas ransel tidak boleh lebih dari 10–15% berat badan Anda. Tas yang terlalu berat membuat Anda cepat lelah dan lambat saat evakuasi jalan kaki.
                </p>
              </div>

              {/* Tip 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Distribusi Berat di Punggung
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Tempatkan barang terberat (air minum, makanan kaleng) di tengah tas yang menempel ke punggung. Barang ringan di bagian bawah; barang darurat (P3K, senter) di kantong atas luar.
                </p>
              </div>

              {/* Tip 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Proteksi Plastik Ziploc Ganda
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Semua dokumen penting (KTP, KK, ijazah, polis), uang tunai, obat resep, dan alat elektronik wajib dimasukkan ke kantong plastik kedap air (ziploc) dua lapis.
                </p>
              </div>

              {/* Tip 4 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Lokasi Penyimpanan Dekat Pintu
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Simpan tas siaga di tempat yang terlihat dan mudah diraih: di samping pintu keluar rumah atau di samping ranjang. Jangan disimpan di lemari terkunci.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Barang Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80">
                  <Luggage className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    Tambah Barang ke Tas Siaga
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    Kustomisasi kebutuhan spesifik keluarga Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Saran Cepat 1-Klik:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Kacamata Cadangan', category: 'Kesehatan', essential: false },
                  { label: 'Uang Tunai Pecahan Kecil', category: 'Dokumen', essential: true },
                  { label: 'Buku Nikah & Ijazah', category: 'Dokumen', essential: true },
                  { label: 'Charger & Powerbank', category: 'Peralatan', essential: false },
                  { label: 'Selimut Termal', category: 'Sandang', essential: false },
                  { label: 'Susu & Botol Balita', category: 'Kesehatan', essential: true },
                  { label: 'Pembalut Higienis', category: 'Kesehatan', essential: true },
                  { label: 'Korek Api Kedap Air', category: 'Peralatan', essential: false }
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewItemLabel(sug.label);
                      setNewItemCategory(sug.category);
                      setNewItemEssential(sug.essential);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-transparent text-slate-700 font-bold text-[11px] transition-all cursor-pointer"
                  >
                    + {sug.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 pt-1">
              {/* Nama Barang Input */}
              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-slate-800">
                  Nama Barang Bawaan:
                </label>
                <input
                  type="text"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="Misal: Kacamata baca cadangan, obat hipertensi, charger..."
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
                  autoFocus
                />
              </div>

              {/* Kategori Grid Chips (replacing outdated dropdown select) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  Pilih Kategori:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.filter(c => c.label !== 'Semua').map(cat => {
                    const CatIcon = cat.icon;
                    const isSelected = newItemCategory === cat.label;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setNewItemCategory(cat.label)}
                        className={`p-2.5 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-200 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <CatIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle Switch Card: Esensial */}
              <div 
                onClick={() => setNewItemEssential(!newItemEssential)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  newItemEssential
                    ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-xl transition-colors ${
                    newItemEssential ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Tandai sebagai Barang Esensial
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Prioritas kritis untuk keselamatan nyawa & identitas
                    </span>
                  </div>
                </div>
                
                {/* Modern Toggle Switch Component */}
                <div className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                  newItemEssential ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
                }`}>
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transition-transform" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newItemLabel.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan ke Tas Siaga</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        <div className="flex items-center gap-2">
          {onNavigateScreen && (
            <button
              type="button"
              onClick={() => onNavigateScreen('safe_route')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Cek Rute Evakuasi</span>
            </button>
          )}

          {onNavigateScreen && (
            <button
              type="button"
              onClick={() => onNavigateScreen('confirm_safe')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>Konfirmasi Posko Aman</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
