'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Info,
  Volume2,
  VolumeX,
  Check,
  Zap,
  PhoneCall,
  Activity,
  Flame,
  Waves,
  Mountain,
  Users,
  Compass
} from 'lucide-react';
import { api } from '../services/api';
import { createSituationAssessment } from '../lib/situationAssessment';
import { speakIndonesian, stopSpeaking } from '../lib/speechVoice';

export default function SituationAssessment({ 
  hazardData, 
  onEnterEmergencyMode, 
  onBack,
  onNavigateScreen 
}) {
  const [analyzing, setAnalyzing] = useState(true);
  const [serverAssessment, setServerAssessment] = useState(null);
  const [assessmentError, setAssessmentError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [activeTab, setActiveTab] = useState('immediate'); // 'immediate' | 'procedural'
  const [completedActions, setCompletedActions] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setAssessmentError('');
    setServerAssessment(null);
    async function fetchAssessment() {
      try {
        const response = await api.requestAssessment({
          hazard_type: hazardData.type,
          user_description: hazardData.description,
          clarifications: hazardData.clarifications,
          location: hazardData.location
        });
        if (isMounted && response?.data) setServerAssessment(response.data);
      } catch (error) {
        if (isMounted) setAssessmentError(error.message || 'Analisis online tidak tersedia.');
      } finally {
        if (isMounted) setAnalyzing(false);
      }
    }
    fetchAssessment();
    return () => { isMounted = false; };
  }, [hazardData]);

  const fallbackAssessment = createSituationAssessment({
    hazardType: hazardData.type,
    location: hazardData.location,
    userDescription: hazardData.description
  });

  // Calculate dynamic context-aware risk factors
  const hasVulnerable = Boolean(
    hazardData.clarifications?.vulnerable_members ||
    /balita|bayi|anak|lansia|kakek|nenek|hamil|cedera|sakit/i.test(hazardData.description || '')
  );
  const hasElectricThreat = Boolean(
    hazardData.clarifications?.mcb_status === 'on' ||
    /listrik|mcb|kabel|nyala/i.test(hazardData.description || '')
  );
  const isTrapped = Boolean(
    hazardData.clarifications?.exit_access === 'blocked' ||
    /terjebak|terkurung|atap|lantai 2|deras|dalam/i.test(hazardData.description || '')
  );

  // Compute calculated risk score
  const baseRiskScore = hazardData.type === 'kebakaran' ? 9.2 :
    hazardData.type === 'gempa' ? 8.9 :
    hazardData.type === 'banjir' ? 8.5 :
    hazardData.type === 'longsor' ? 8.8 :
    hazardData.type === 'erupsi' ? 8.7 : 7.8;
  const calculatedRiskScore = Math.min(9.8, (baseRiskScore + (isTrapped ? 0.8 : 0) + (hasVulnerable ? 0.4 : 0)).toFixed(1));

  const urgencyLabel = isTrapped || calculatedRiskScore >= 9.0 
    ? 'SIAGA 1 (URGENSI KRITIS - SEGERA EVAKUASI)'
    : calculatedRiskScore >= 8.0 
      ? 'SIAGA 2 (URGENSI TINGGI - WASPADA BAHAYA)'
      : 'SIAGA 3 (URGENSI SIAGA - PERSIAPAN)';

  const urgencyBadgeColor = calculatedRiskScore >= 9.0
    ? 'bg-rose-50 text-rose-800 border-rose-200'
    : 'bg-amber-50 text-amber-800 border-amber-200';

  const localAssessment = {
    summary: fallbackAssessment.situation_summary,
    urgencyLevel: urgencyLabel,
    urgencyBadgeColor,
    reportedInformation: fallbackAssessment.reported_information,
    knownConditions: [
      `Jenis ancaman bencana: ${hazardData.type.toUpperCase()}`,
      `Kondisi listrik: ${hasElectricThreat ? 'Aliran aktif (Segera putuskan MCB)' : 'Telah diisolasi / padam'}`,
      `Kelompok rentan: ${hasVulnerable ? 'Ada balita / lansia (Prioritas dampingi)' : 'Mandiri'}`,
      `Akses keluar: ${isTrapped ? 'Terkendala / Jalur terhalang' : 'Tersedia akses darurat terbuka'}`
    ],
    unknowns: [
      'Perkembangan ketinggian ancaman dalam 30 menit ke depan',
      'Kondisi kepadatan jembatan dan titik crossing rute utama'
    ],
    immediateActions: [
      {
        title: 'Amankan Diri & Lindungi Saluran Vital',
        desc: hazardData.type === 'banjir'
          ? 'Matikan sakelar MCB listrik utama dan jauhi tiang/kabel listrik yang tergenang. Jangan menyeberang arus melebihi betis.'
          : hazardData.type === 'gempa'
            ? 'Merunduk di bawah meja kokoh (Drop, Cover, Hold On) dan jauhi jendela kaca serta lemari tinggi.'
            : hazardData.type === 'kebakaran'
              ? 'Merangkak rendah di bawah kepulan asap dan tutup hidung/mulut menggunakan kain basah.'
              : hazardData.type === 'longsor'
                ? 'Evakuasi menyamping menjauhi arah runtuhan lereng dan jauhi aliran sungai yang mendadak keruh.'
                : hazardData.type === 'erupsi'
                  ? 'Gunakan masker N95 dan kacamata pelindung untuk menghindari partikel silika abu vulkanik tajam.'
                  : 'Pindah segera dari zona bahaya fisik langsung ke ruang terbuka yang kokoh.',
        critical: true,
        duration: '2 Menit'
      },
      {
        title: 'Mobilisasi Kelompok Rentan & Bawa Tas Siaga (TSB)',
        desc: 'Bawa kantong kedap air berisi KTP/KK, obat-obatan rutin esensial, senter, dan powerbank. Dampingi lansia dan balita dalam satu barisan aman.',
        critical: true,
        duration: '3 Menit'
      },
      {
        title: 'Menuju Rute Darurat Menghindari Titik Rawan',
        desc: 'Susuri jalan utama yang tinggi dan terhindar dari underpass/cekungan. Jangan kembali ke dalam rumah untuk mengambil barang berharga.',
        critical: true,
        duration: '5 Menit'
      }
    ],
    nextActions: [
      'Lapor ke meja absensi petugas posko SAR terdekat untuk verifikasi pendataan logistik.',
      'Periksa kondisi kesehatan anggota keluarga di tenda pos medis darurat.',
      'Kirimkan kabar status aman ke grup keluarga menggunakan fitur Status Keluarga offline.',
      'Pantau terus pengumuman pengeras suara posko resmi dan buletin BMKG/BNPB.'
    ],
    confidenceLimitation: fallbackAssessment.confidence_limitation,
    sourceFreshness: fallbackAssessment.source_and_freshness
  };

  const assessment = serverAssessment ? {
    summary: serverAssessment.situation_summary,
    urgencyLevel: urgencyLabel,
    urgencyBadgeColor,
    knownConditions: localAssessment.knownConditions,
    reportedInformation: serverAssessment.reported_information,
    unknowns: serverAssessment.missing_information,
    immediateActions: localAssessment.immediateActions,
    nextActions: localAssessment.nextActions,
    confidenceLimitation: serverAssessment.confidence_limitation,
    sourceFreshness: serverAssessment.source_and_freshness,
    escalation: serverAssessment.escalation,
    isFromServer: true
  } : localAssessment;

  const toggleSpeech = () => {
    if (!speechSupported) return;

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    try {
      const parts = [
        `Panduan tindakan darurat. Tingkat urgensi: ${assessment.urgencyLevel}.`,
        `Ringkasan situasi di ${hazardData.location || 'wilayah Anda'}: ${hazardData.description || 'Ancaman siaga aktif'}.`,
        'Tindakan kritis yang harus segera dilakukan sekarang:',
        ...assessment.immediateActions.map((act, i) => `Langkah ke-${i + 1}: ${act.title}. ${act.desc}`),
        'Langkah lanjutan setelah tiba di posko aman:',
        ...assessment.nextActions.map((na, i) => `Catatan ${i + 1}: ${na}`)
      ];
      const fullText = parts.join(' ');
      speakIndonesian(fullText, {
        rate: 0.92,
        onstart: () => setIsSpeaking(true),
        onend: () => setIsSpeaking(false),
        onerror: () => setIsSpeaking(false)
      });
    } catch (err) {
      console.warn('Speech synthesis error', err);
      setIsSpeaking(false);
    }
  };

  const toggleActionComplete = (index) => {
    setCompletedActions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getHazardIcon = () => {
    switch (hazardData.type) {
      case 'gempa': return Activity;
      case 'kebakaran': return Flame;
      case 'longsor': return Mountain;
      case 'erupsi': return AlertTriangle;
      default: return Waves;
    }
  };

  const HazardIcon = getHazardIcon();

  if (analyzing) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-6 animate-fadeIn">
        <div className="relative w-24 h-24 mx-auto">
          <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-blue-600 border-t-transparent animate-spin" />
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center absolute inset-0 m-auto">
            <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider">
            AI Triage Engine
          </span>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Menganalisis Risiko & Menyusun Panduan Tindakan...
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Menghitung zona bahaya, prioritas keselamatan kelompok rentan, serta rute aman menuju posko terdekat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn pb-16">
      
      {/* 1. VISUAL STEPPER BREADCRUMB */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs font-extrabold pb-1">
          <div className="flex items-center gap-2 text-emerald-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              ✓
            </span>
            <span className="font-semibold text-slate-600">Input Situasi</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-emerald-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              ✓
            </span>
            <span className="font-semibold text-slate-600">Tinjau Data</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-blue-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              3
            </span>
            <span className="border-b-2 border-blue-600 pb-0.5">Analisis & Panduan</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">
              4
            </span>
            <span>Panduan Lapangan</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER */}
      <div className="text-left space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Hasil Triase & Penilaian Risiko</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Panduan Tindakan & Prioritas Keselamatan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          Berdasarkan kondisi yang Anda laporkan di <strong className="text-slate-900">{hazardData.location || 'lokasi Anda'}</strong>, ikuti urutan instruksi terarah berikut untuk melindungi keluarga.
        </p>
      </div>

      {/* 3. LIGHT VOICE GUIDANCE BAR (Clean, No Dark Block) */}
      {speechSupported && (
        <div className="flex items-center justify-between p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSpeaking ? 'bg-rose-500 text-white animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-extrabold text-slate-900 truncate">Panduan Suara Keselamatan (TTS)</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {isSpeaking ? 'Sedang membacakan instruksi keselamatan...' : 'Dengarkan panduan audio saat panik'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSpeech}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${
              isSpeaking
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-100/50'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Hentikan</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Dengarkan</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 4. PRIMARY EXECUTIVE TRIAGE CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-5">
        
        {/* Urgency Badge & Risk Score Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Klasifikasi Triase Siaga
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide border ${assessment.urgencyBadgeColor}`}>
                {assessment.urgencyLevel}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 sm:self-center">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Indeks Risiko</span>
              <span className="text-base font-black text-rose-600 leading-none">{calculatedRiskScore} / 10</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <HazardIcon className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Triage Insight Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200/60 space-y-0.5">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" /> Golden Time
            </span>
            <p className="text-xs font-black text-slate-900">~15 Menit</p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Listrik
            </span>
            <p className="text-xs font-black text-slate-900">
              {hasElectricThreat ? 'Potensi Aktif' : 'Padam/Aman'}
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-500" /> Rentan
            </span>
            <p className="text-xs font-black text-slate-900">
              {hasVulnerable ? 'Ada Balita/Lansia' : 'Mandiri'}
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block flex items-center gap-1">
              <Compass className="w-3 h-3 text-emerald-600" /> Posko
            </span>
            <p className="text-xs font-black text-slate-900 truncate">Balai RW 04</p>
          </div>
        </div>

        {/* Known Conditions & Caution Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Kondisi Lapangan Teridentifikasi:</span>
            </div>
            <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside font-medium pl-1">
              {assessment.knownConditions.map((kc, i) => (
                <li key={i}>{kc}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Titik Kritis yang Perlu Diwaspadai:</span>
            </div>
            <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside font-medium pl-1">
              {assessment.unknowns.map((uk, i) => (
                <li key={i}>{uk}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 5. STREAMLINED ACTION TABS (Light Segmented Control) */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-sm">
          <button
            type="button"
            onClick={() => setActiveTab('immediate')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'immediate'
                ? 'bg-white text-blue-800 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tindakan Kritis ({assessment.immediateActions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('procedural')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'procedural'
                ? 'bg-white text-blue-800 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Langkah di Posko ({assessment.nextActions.length})
          </button>
        </div>

        {/* Tab 1: Immediate Actions */}
        {activeTab === 'immediate' && (
          <div className="space-y-2.5 animate-fadeIn">
            {assessment.immediateActions.map((action, idx) => {
              const isChecked = Boolean(completedActions[idx]);
              return (
                <div 
                  key={idx}
                  onClick={() => toggleActionComplete(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-white border-slate-200/90 hover:border-blue-400 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-blue-600 text-white font-extrabold text-xs'
                      }`}
                    >
                      {isChecked ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                    </button>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className={`text-xs sm:text-sm font-extrabold ${isChecked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {action.title}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {action.duration || '2 Menit'}
                          </span>
                          {action.critical && (
                            <span className="text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-md uppercase">
                              Wajib
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs leading-relaxed ${isChecked ? 'text-slate-400' : 'text-slate-600'}`}>
                        {action.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Procedural Next Steps */}
        {activeTab === 'procedural' && (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 animate-fadeIn">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Protokol Setelah Tiba di Posko Aman:</span>
            </h3>
            <div className="space-y-2">
              {assessment.nextActions.map((stepText, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {stepText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. LIGHT HELPLINE BAR (No Black Section) */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">Perlu evakuasi SAR langsung?</span>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="tel:112"
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors text-xs"
          >
            112 Darurat
          </a>
          <a 
            href="tel:115"
            className="px-3 py-1 bg-white hover:bg-slate-100 text-blue-800 border border-slate-300 font-bold rounded-lg transition-colors text-xs"
          >
            115 Basarnas
          </a>
        </div>
      </div>

      {/* 7. BOTTOM ACTION BUTTONS */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Koreksi Input</span>
        </button>

        <button
          type="button"
          onClick={onEnterEmergencyMode}
          className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm sm:text-base shadow-md shadow-blue-600/25 active:scale-98 transition-all cursor-pointer"
        >
          <span>Mulai Panduan Lapangan (Langkah 1-4)</span>
          <ArrowRight className="w-5 h-5 text-blue-100" />
        </button>
      </div>

    </div>
  );
}
