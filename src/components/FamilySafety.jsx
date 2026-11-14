'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Heart, 
  Trash2, 
  ArrowLeft, 
  ShieldCheck, 
  MapPin,
  PhoneCall,
  ClipboardCheck,
  ExternalLink,
  Clock3,
  Copy,
  QrCode,
  ScanLine,
  Camera,
  RefreshCw,
  Navigation,
  AlertTriangle,
  HeartHandshake,
  Check,
  Shield,
  PhoneForwarded,
  Info,
  ChevronRight,
  X
} from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../data/mockData';

export default function FamilySafety({ 
  currentUser,
  onRequireAccount,
  familyMembers, 
  setFamilyMembers, 
  familyPlan,
  setFamilyPlan,
  checklistItems,
  familyAccess,
  familySyncStatus,
  familySyncError,
  familyInvite,
  isFamilySyncBusy,
  initialInviteToken,
  onCreateFamilyInvite,
  onJoinFamilyInvite,
  onBack,
  onNavigateScreen,
  onNavigateRoute
}) {
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'plan' | 'contacts'
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('invite');
  const [inviteToken, setInviteToken] = useState('');
  const [newRelationship, setNewRelationship] = useState('Anggota Keluarga');
  const [newNeeds, setNewNeeds] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [actionError, setActionError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const videoRef = useRef(null);

  const checkInStatus = member => member.checkInStatus
    || (member.status === 'together' ? 'safe' : 'unconfirmed');

  const handleCheckIn = (id, status) => {
    setFamilyMembers(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: status === 'safe' ? 'together' : 'unconfirmed',
          checkInStatus: status,
          checkedInAt: new Date().toISOString()
        };
      }
      return m;
    }));
  };

  const handleJoinGroup = async (event) => {
    event.preventDefault();
    setActionError('');
    try {
      const joined = await onJoinFamilyInvite(extractInviteToken(inviteToken), {
        name: currentUser.name,
        relationship: newRelationship,
        supportNeeds: newNeeds.trim() || 'Tidak ada kebutuhan khusus tercatat'
      });
      if (!joined) return;
      setShowAddModal(false);
      setInviteToken('');
      setNewNeeds('');
      setScannerOpen(false);
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleCreateInvite = async () => {
    setActionError('');
    try {
      await onCreateFamilyInvite();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleOpenInvite = () => {
    setShowAddModal(true);
    setAddMode('invite');
    setActionError('');
    void handleCreateInvite();
  };

  const extractInviteToken = value => {
    const input = value.trim();
    try {
      const url = new URL(input, window.location.origin);
      return url.searchParams.get('familyInvite')?.trim().toLowerCase() || input.toLowerCase();
    } catch {
      return input.toLowerCase();
    }
  };

  useEffect(() => {
    if (initialInviteToken) {
      setShowAddModal(true);
      setAddMode('join');
      setInviteToken(extractInviteToken(initialInviteToken));
    }
  }, [initialInviteToken]);

  useEffect(() => {
    if (!familyInvite?.url) {
      setQrImage('');
      return;
    }

    let active = true;
    import('qrcode').then(({ default: QRCode }) =>
      QRCode.toDataURL(familyInvite.url, { width: 240, margin: 2, errorCorrectionLevel: 'M' })
    ).then(image => {
      if (active) setQrImage(image);
    }).catch(error => {
      console.error('Gagal membuat QR undangan keluarga:', error);
      if (active) setActionError('QR tidak dapat dibuat. Anda tetap bisa membagikan token undangan.');
    });

    return () => {
      active = false;
    };
  }, [familyInvite]);

  useEffect(() => {
    if (!scannerOpen) return undefined;

    let active = true;
    let stream;
    let timeoutId;

    const startScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof window.BarcodeDetector !== 'function') {
        setScannerError('Pemindai QR tidak didukung browser ini. Masukkan token undangan secara manual.');
        return;
      }

      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const scan = async () => {
          if (!active || !videoRef.current) return;
          try {
            const [result] = await detector.detect(videoRef.current);
            if (result?.rawValue) {
              setInviteToken(extractInviteToken(result.rawValue));
              setScannerOpen(false);
              return;
            }
          } catch (error) {
            console.warn('Pemindaian QR belum berhasil:', error);
          }
          timeoutId = window.setTimeout(scan, 300);
        };
        scan();
      } catch (error) {
        console.error('Kamera tidak dapat dibuka untuk memindai undangan:', error);
        setScannerError('Kamera tidak dapat diakses. Izinkan akses kamera atau masukkan token secara manual.');
      }
    };

    setScannerError('');
    startScanner();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      stream?.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [scannerOpen]);

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} disalin.`);
      setTimeout(() => setCopyStatus(''), 2500);
    } catch (error) {
      console.error(`Gagal menyalin ${label.toLowerCase()}:`, error);
      setCopyStatus('Gagal menyalin. Pilih dan salin teks secara manual.');
    }
  };

  const handleDeleteMember = (id) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  const safeCount = familyMembers.filter(m => checkInStatus(m) === 'safe').length;
  const helpCount = familyMembers.filter(m => checkInStatus(m) === 'help').length;
  const unconfirmedCount = familyMembers.filter(m => checkInStatus(m) === 'unconfirmed').length;

  const essentialItems = checklistItems.filter(item => item.essential);
  const readyEssentials = essentialItems.filter(item => item.completed).length;
  const readinessTasks = [
    { label: 'Profil anggota dan kebutuhan bantuan sudah dicatat', done: familyMembers.length > 0 },
    { label: 'Titik kumpul keluarga sudah disepakati', done: Boolean(familyPlan.meetingPoint?.trim() && familyPlan.meetingArea?.trim()) },
    { label: 'Kontak cadangan keluarga sudah disimpan', done: (familyPlan.backupContacts || []).some(contact => contact.trim()) },
    { label: 'Tas siaga: barang esensial sudah dicek', done: essentialItems.length > 0 && readyEssentials === essentialItems.length }
  ];
  const readinessCount = readinessTasks.filter(task => task.done).length;
  const localEmergencyVerified = Boolean(
    familyPlan.localEmergencyNumber
    && familyPlan.localEmergencySource
    && familyPlan.localEmergencyCheckedAt
  );
  const updatePlanField = (field, value) => setFamilyPlan(prev => ({ ...prev, [field]: value }));
  const updateBackupContact = (index, value) => setFamilyPlan(prev => ({
    ...prev,
    backupContacts: prev.backupContacts.map((contact, contactIndex) => contactIndex === index ? value : contact)
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-16">
      
      {/* 1. HEADER SECTION (Clean, Aesthetic, Light) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Status Keselamatan Keluarga</span>
            </span>

            {/* Sync Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              familySyncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : familySyncStatus === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                familySyncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`} />
              <span>
                {familySyncStatus === 'synced' ? 'Tersinkronisasi Online' : 'Penyimpanan Lokal'}
              </span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Koordinasi & Pemantauan Keluarga
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal max-w-xl">
            Kelola kebutuhan khusus, pantau status check-in kerabat tanpa ketergantungan pulsa, dan koordinasikan rute evakuasi mandiri.
          </p>
        </div>

        <button
          type="button"
          onClick={currentUser.isGuest ? onRequireAccount : handleOpenInvite}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-2xl shadow-sm shadow-blue-600/25 transition-all cursor-pointer hover:scale-102 active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          <span>{currentUser.isGuest ? 'Masuk untuk Tambah' : 'Tambah Anggota'}</span>
        </button>
      </div>

      {/* 2. STATS SUMMARY BENTO GRID */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{familyMembers.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Anggota terdaftar</p>
        </div>

        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aman</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{safeCount}</p>
          <p className="text-[11px] text-emerald-700 font-medium">Sudah check-in aman</p>
        </div>

        <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Perhatian</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-900">{helpCount + unconfirmedCount}</p>
          <p className="text-[11px] text-rose-700 font-medium">
            {helpCount > 0 ? `${helpCount} butuh bantuan` : `${unconfirmedCount} belum check-in`}
          </p>
        </div>
      </div>

      {/* 3. SEGMENTED TAB NAVIGATION */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-white text-blue-700 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Anggota Keluarga ({familyMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plan')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plan'
              ? 'bg-white text-blue-700 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Titik Kumpul & Rencana</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-white text-blue-700 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Kontak Darurat</span>
        </button>
      </div>

      {/* 4. TAB 1: MEMBERS LIST */}
      {activeTab === 'members' && (
        <div className="space-y-3 animate-fadeIn">
          {familyMembers.map((member) => {
            const status = checkInStatus(member);
            const statusConfig = {
              safe: {
                label: 'Aman di Posko / Bersama',
                badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                dot: 'bg-emerald-500',
                avatarBg: 'bg-emerald-100 text-emerald-800'
              },
              help: {
                label: 'Butuh Bantuan Segera',
                badge: 'bg-rose-50 text-rose-800 border-rose-300',
                dot: 'bg-rose-500 animate-ping',
                avatarBg: 'bg-rose-100 text-rose-800'
              },
              unconfirmed: {
                label: 'Belum Terkonfirmasi',
                badge: 'bg-amber-50 text-amber-800 border-amber-300',
                dot: 'bg-amber-500',
                avatarBg: 'bg-amber-100 text-amber-800'
              }
            }[status];

            return (
              <div
                key={member.id}
                className="p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-2xs transition-all space-y-4"
              >
                {/* Header row: Avatar, Info, Status pill, Delete */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${statusConfig.avatarBg}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-slate-900 text-base">{member.name}</h3>
                        <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
                          {member.relationship}
                        </span>
                      </div>

                      {/* Support Needs */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <HeartHandshake className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-700">Kebutuhan:</span>
                        <span className="text-slate-600 truncate">{member.supportNeeds}</span>
                      </div>

                      {/* Status Badge */}
                      <div className="pt-0.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusConfig.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          <span>{statusConfig.label}</span>
                          {member.checkedInAt && (
                            <span className="text-slate-400 font-normal">
                              · {new Date(member.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {member.id !== 'f1' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Hapus data anggota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Action Bar: Status Toggle & Direct Route */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Ubah Status:</span>
                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleCheckIn(member.id, 'safe')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          status === 'safe'
                            ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-emerald-800'
                        }`}
                      >
                        Aman
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCheckIn(member.id, 'help')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          status === 'help'
                            ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-rose-800'
                        }`}
                      >
                        Butuh Bantuan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCheckIn(member.id, 'unconfirmed')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          status === 'unconfirmed'
                            ? 'bg-amber-600 text-white shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-amber-800'
                        }`}
                      >
                        Belum Tahu
                      </button>
                    </div>
                  </div>

                  {member.id !== 'f1' && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = {
                          id: member.id,
                          name: `${member.name} (${member.relationship})`,
                          category: 'keluarga',
                          itemType: 'warga',
                          relationship: member.relationship,
                          supportNeeds: member.supportNeeds
                        };
                        if (onNavigateRoute) {
                          onNavigateRoute(target);
                        } else {
                          onNavigateScreen('route');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                      title="Arahkan navigasi rute ke anggota keluarga ini"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Arahkan Rute</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. TAB 2: TITIK KUMPUL & RENCANA KESIAPAN */}
      {activeTab === 'plan' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Card 1: Meeting Point & Contacts */}
          <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Kesepakatan Titik Kumpul Keluarga</h3>
                  <p className="text-[11px] text-slate-500">Lokasi evakuasi pertama saat terpisah</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {readinessCount}/4 Siap
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Tempat / Titik Kumpul:
                </label>
                <input
                  type="text"
                  value={familyPlan.meetingPoint || ''}
                  onChange={event => updatePlanField('meetingPoint', event.target.value)}
                  placeholder="Contoh: Lapangan Balai RW 04, Halaman SDN 01..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-xs sm:text-sm text-slate-900 font-semibold outline-none bg-slate-50/50 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alamat / Patokan Alternatif:
                </label>
                <input
                  type="text"
                  value={familyPlan.meetingArea || ''}
                  onChange={event => updatePlanField('meetingArea', event.target.value)}
                  placeholder="Contoh: Depan gapura utama, dekat pohon beringin..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-xs sm:text-sm text-slate-900 font-semibold outline-none bg-slate-50/50 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {(familyPlan.backupContacts || ['', '']).map((contact, index) => (
                  <div key={index}>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Kontak Cadangan Darurat {index + 1}:
                    </label>
                    <input
                      type="tel"
                      value={contact}
                      onChange={event => updateBackupContact(index, event.target.value)}
                      placeholder="0812-xxxx-xxxx (Keluarga/Tetangga)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-xs sm:text-sm text-slate-900 font-semibold outline-none bg-slate-50/50 focus:bg-white transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Readiness Checklist */}
          <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Daftar Kesiapan Mandiri Sebelum Krisis</h3>
            </div>

            <div className="space-y-2">
              {readinessTasks.map(task => (
                <div key={task.label} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${task.done ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className={`text-xs font-semibold ${task.done ? 'text-slate-800' : 'text-slate-500'}`}>
                    {task.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigateScreen('checklist')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Periksa Checklist Tas Siaga Bencana (TSB)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 6. TAB 3: EMERGENCY DIRECTORY */}
      {activeTab === 'contacts' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Nomor Darurat Nasional Resmi</h3>
                <p className="text-[11px] text-slate-500">Panggilan bebas pulsa dalam kondisi kritis</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EMERGENCY_CONTACTS.map(contact => (
                <div key={contact.number} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">{contact.name}</p>
                    <p className="text-[11px] text-slate-500">{contact.source}</p>
                  </div>
                  <a
                    href={`tel:${contact.number}`}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{contact.number}</span>
                  </a>
                </div>
              ))}
            </div>

            {/* Local BPBD Contact */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="font-extrabold text-slate-800 text-xs">Kontak Khusus Daerah / BPBD Setempat:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={familyPlan.localEmergencyName || ''}
                  onChange={event => updatePlanField('localEmergencyName', event.target.value)}
                  placeholder="Nama posko/BPBD lokal"
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                />
                <input
                  type="tel"
                  value={familyPlan.localEmergencyNumber || ''}
                  onChange={event => updatePlanField('localEmergencyNumber', event.target.value)}
                  placeholder="Nomor telepon lokal"
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. PRIVACY & SAFETY CARD */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 text-xs text-blue-950">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Privasi Terjaga:</strong> Seluruh catatan pendampingan dan status keluarga disimpan secara lokal pada perangkat Anda dan hanya dibagikan ke anggota grup yang Anda undang secara sadar.
        </p>
      </div>

      {/* 8. BOTTOM NAVIGATION BAR */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateScreen('route')}
          className="flex items-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-98"
        >
          <span>Lanjut ke Peta & Jalur Evakuasi</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 9. FAMILY INVITATION & JOIN MODAL (Portal) */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Undang atau Gabung Grup Keluarga</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setAddMode('invite'); setScannerOpen(false); setActionError(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  addMode === 'invite' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600'
                }`}
              >
                Buat Undangan (QR)
              </button>
              <button
                type="button"
                onClick={() => { setAddMode('join'); setActionError(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  addMode === 'join' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600'
                }`}
              >
                Gabung via Token
              </button>
            </div>

            {addMode === 'invite' ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Bagikan QR code atau token ini kepada anggota keluarga agar data koordinasi dapat tersinkronkan antar perangkat secara otomatis.
                </p>

                <button
                  type="button"
                  onClick={handleCreateInvite}
                  disabled={isFamilySyncBusy}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isFamilySyncBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  <span>{familyInvite ? 'Perbarui Token Undangan' : 'Buat Token Undangan Baru'}</span>
                </button>

                {familyInvite && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-center sm:text-left sm:flex sm:items-center sm:gap-4">
                    {qrImage && (
                      <img src={qrImage} alt="QR Undangan" className="w-36 h-36 rounded-xl bg-white p-2 mx-auto sm:mx-0 border border-slate-200" />
                    )}
                    <div className="min-w-0 space-y-2 flex-1">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Token Undangan:</span>
                        <p className="font-mono text-base font-black text-blue-700 break-all">{familyInvite.token}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => handleCopy(familyInvite.token, 'Token')}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Token</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(familyInvite.url, 'Tautan')}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Salin Tautan</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Berlaku 24 jam untuk 1 anggota.
                      </p>
                    </div>
                  </div>
                )}

                {copyStatus && <p className="text-xs text-emerald-700 font-bold">{copyStatus}</p>}
              </div>
            ) : (
              <form onSubmit={handleJoinGroup} className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Masukkan token undangan yang dibagikan oleh kepala keluarga Anda.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Token Undangan:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={inviteToken}
                      onChange={event => setInviteToken(event.target.value.toLowerCase())}
                      placeholder="Tempel token undangan..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:border-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setScannerOpen(open => !open)}
                      className="px-3 py-2 rounded-xl border border-blue-600 text-blue-700 text-xs font-bold hover:bg-blue-50 flex items-center gap-1.5 shrink-0"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{scannerOpen ? 'Tutup' : 'Scan'}</span>
                    </button>
                  </div>
                </div>

                {scannerOpen && (
                  <div className="p-2 bg-slate-900 rounded-2xl space-y-2">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full max-h-48 rounded-xl object-cover" />
                    <p className="text-white text-[11px] text-center">Arahkan kamera ke QR code undangan.</p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Peran / Hubungan:</label>
                  <select
                    value={newRelationship}
                    onChange={event => setNewRelationship(event.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="Anggota Keluarga">Anggota Keluarga</option>
                    <option value="Orang Tua / Lansia">Orang Tua / Lansia</option>
                    <option value="Anak / Balita">Anak / Balita</option>
                    <option value="Pasangan">Pasangan</option>
                    <option value="Kerabat / Tetangga">Kerabat / Tetangga</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Kebutuhan Bantuan Khusus (Opsional):</label>
                  <input
                    type="text"
                    value={newNeeds}
                    onChange={event => setNewNeeds(event.target.value)}
                    placeholder="Contoh: Butuh obat rutin, bantuan kursi roda..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none bg-white"
                  />
                </div>

                {actionError && (
                  <p className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
                    {actionError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isFamilySyncBusy || !inviteToken.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Gabung ke Grup Keluarga
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
