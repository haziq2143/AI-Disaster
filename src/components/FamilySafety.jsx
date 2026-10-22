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
  UserCheck, 
  HelpCircle,
  Plus,
  Navigation
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
    e.preventDefault();
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
    } catch (error) {
      console.error(`Gagal menyalin ${label.toLowerCase()}:`, error);
      setCopyStatus('Gagal menyalin. Pilih dan salin teks secara manual.');
    }
  };

  const handleDeleteMember = (id) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  const checkedInCount = familyMembers.filter(m => checkInStatus(m) !== 'unconfirmed').length;
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
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500">
            {currentUser.isGuest
              ? 'Masuk atau buat akun untuk membuat QR undangan dan menyinkronkan data keluarga antar perangkat.'
              : <>Tekan <strong>Tambah Anggota</strong> untuk langsung membuat QR/token. Data keluarga akan disimpan di server agar bisa disinkronkan ke perangkat yang bergabung.</>}
          </p>
        </div>

        <button
          type="button"
          onClick={currentUser.isGuest ? onRequireAccount : handleOpenInvite}
          aria-label={currentUser.isGuest ? 'Masuk untuk menambah anggota' : 'Tambah Anggota'}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D47A1] hover:bg-[#1565C0] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{currentUser.isGuest ? 'Masuk untuk tambah anggota' : 'Tambah Anggota'}</span>
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
              {checkedInCount} dari {familyMembers.length} Anggota Sudah Check-in
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          checkedInCount === familyMembers.length
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-amber-100 text-amber-900'
        }`}>
          {checkedInCount === familyMembers.length ? 'Semua Check-in' : 'Ada yang Belum'}
        </span>
      </div>

      <section className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs leading-relaxed text-blue-950">
        <strong>Check-in manual (simulasi)</strong>
        <p className="mt-1">
          {familySyncStatus === 'synced'
            ? 'Status tersinkron ke anggota grup saat online. Tidak mengirim pesan, notifikasi, atau lokasi.'
            : 'Status hanya tersimpan di perangkat ini sampai grup keluarga tersambung. Tidak mengirim pesan, lokasi, atau notifikasi.'}
        </p>
      </section>

      <section className={`rounded-2xl border p-4 text-xs ${
        familySyncStatus === 'synced'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : familySyncStatus === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-900'
            : 'border-slate-200 bg-white text-slate-700'
      }`}>
        <p className="font-bold">
          {familySyncStatus === 'synced'
            ? 'Keluarga tersambung · perubahan dibagikan ke perangkat anggota'
            : familySyncStatus === 'error'
              ? 'Sinkronisasi keluarga bermasalah'
              : familyAccess
                ? 'Menyambungkan ke grup keluarga…'
                : 'Data keluarga hanya tersimpan di perangkat ini'}
        </p>
        {familySyncError && <p className="mt-1">{familySyncError}</p>}
        {familyAccess && familySyncStatus === 'synced' && (
          <p className="mt-1">Periksa status secara manual; aplikasi tidak mengirim notifikasi atau melacak lokasi.</p>
        )}
      </section>

      {/* List of Family Members */}
      <div className="space-y-3">
        {familyMembers.map((member) => {
          const status = checkInStatus(member);
          const statusInfo = {
            safe: { label: 'Saya aman', style: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
            help: { label: 'Butuh bantuan', style: 'border-rose-300 bg-rose-50 text-rose-800' },
            unconfirmed: { label: 'Belum dikonfirmasi', style: 'border-amber-300 bg-amber-50 text-amber-900' }
          }[status];
          const isTogether = status === 'safe';
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
                  <div className="min-w-0 space-y-1">
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
                    <p className={`inline-flex rounded-lg border px-2 py-1 text-[11px] font-bold ${statusInfo.style}`}>
                      {statusInfo.label}
                      {member.checkedInAt && ` · ${new Date(member.checkedInAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}`}
                    </p>
                  </div>
                </div>

                <div className="flex max-w-[16rem] flex-wrap items-center justify-end gap-1.5">
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
                      className="min-h-9 rounded-lg border border-blue-200 bg-blue-50 px-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      title="Arahkan rute evakuasi ke anggota keluarga ini"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Rute</span>
                    </button>
                  )}
                  <button type="button" onClick={() => handleCheckIn(member.id, 'safe')} className="min-h-9 rounded-lg border border-emerald-200 bg-white px-2 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50">
                    Aman
                  </button>
                  <button type="button" onClick={() => handleCheckIn(member.id, 'help')} className="min-h-9 rounded-lg border border-rose-200 bg-white px-2 text-[11px] font-bold text-rose-800 hover:bg-rose-50">
                    Butuh bantuan
                  </button>
                  <button type="button" onClick={() => handleCheckIn(member.id, 'unconfirmed')} className="min-h-9 rounded-lg border border-amber-200 bg-white px-2 text-[11px] font-bold text-amber-900 hover:bg-amber-50">
                    Belum tahu
                  </button>
                  {member.id !== 'f1' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus anggota"
                      aria-label={`Hapus ${member.name}`}
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

      <section className="glass-card p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="eyebrow">Rencana sebelum bencana</span>
            <h3 className="mt-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
              <MapPin className="h-4 w-4 text-blue-700" />
              Titik kumpul & kontak cadangan
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {familySyncStatus === 'synced'
                ? 'Rencana ini disinkronkan ke perangkat anggota grup saat online.'
                : 'Rencana ini disimpan di perangkat dan belum dibagikan ke anggota lain.'}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-900">{readinessCount}/4 siap</span>
        </div>

        <label className="block text-xs font-bold text-slate-700">
          Nama titik kumpul keluarga
          <input
            value={familyPlan.meetingPoint || ''}
            onChange={event => updatePlanField('meetingPoint', event.target.value)}
            placeholder="Contoh: lapangan dekat kantor kelurahan"
            className="form-control mt-1.5"
          />
        </label>
        <label className="block text-xs font-bold text-slate-700">
          Alamat atau petunjuk lokasi
          <textarea
            value={familyPlan.meetingArea || ''}
            onChange={event => updatePlanField('meetingArea', event.target.value)}
            placeholder="Tulis patokan yang mudah dikenali dan jalur alternatif"
            rows={2}
            className="form-control mt-1.5"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {(familyPlan.backupContacts || ['', '']).map((contact, index) => (
            <label key={index} className="block text-xs font-bold text-slate-700">
              Kontak cadangan {index + 1}
              <input
                type="tel"
                inputMode="tel"
                value={contact}
                onChange={event => updateBackupContact(index, event.target.value)}
                placeholder="Nomor keluarga / tetangga tepercaya"
                className="form-control mt-1.5"
              />
            </label>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          Simpan nomor di perangkat keluarga masing-masing juga. Di dalam grup tersambung, rencana dibagikan kepada anggota grup; aplikasi tidak mengirim pesan atau notifikasi check-in.
        </p>

        <div className="border-t border-slate-200/80 pt-4">
          <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <ClipboardCheck className="h-4 w-4 text-blue-700" />
            Kesiapan keluarga sebelum bencana
          </h4>
          <ul className="mt-3 space-y-2">
            {readinessTasks.map(task => (
              <li key={task.label} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${task.done ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={task.done ? 'text-slate-700' : 'text-slate-500'}>{task.label}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onNavigateScreen('checklist')} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800">
            <ClipboardCheck className="h-4 w-4" />
            Periksa tas siaga
          </button>
        </div>
      </section>

      <section className="glass-card p-4 sm:p-5 space-y-3">
        <div>
          <span className="eyebrow">Direktori kontak darurat</span>
          <h3 className="mt-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
            <PhoneCall className="h-4 w-4 text-rose-600" />
            Nomor umum Indonesia — cek ketersediaan daerah
          </h3>
        </div>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
          Ketersediaan nomor dapat berbeda menurut wilayah dan operator. Nomor di bawah belum diverifikasi untuk lokasi Anda. Periksa situs resmi/pemerintah daerah sebelum keadaan darurat.
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {EMERGENCY_CONTACTS.map(contact => (
            <div key={contact.number} className="rounded-xl border border-slate-200 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">{contact.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{contact.source}</p>
                </div>
                <a href={`tel:${contact.number}`} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-rose-600 px-3 text-sm font-extrabold text-white hover:bg-rose-700">
                  <PhoneCall className="h-3.5 w-3.5" />
                  {contact.number}
                </a>
              </div>
              <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800">
                <Clock3 className="h-3 w-3" />
                Cek daerah: belum diverifikasi
              </p>
              {contact.url && (
                <a href={contact.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-blue-700 hover:underline">
                  Sumber resmi <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="grid gap-3 border-t border-slate-200/80 pt-4 sm:grid-cols-2">
          <label className="block text-xs font-bold text-slate-700">
            Kontak lokal (BPBD / posko)
            <input value={familyPlan.localEmergencyName || ''} onChange={event => updatePlanField('localEmergencyName', event.target.value)} placeholder="Nama instansi/posko" className="form-control mt-1.5" />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Nomor kontak lokal
            <input type="tel" inputMode="tel" value={familyPlan.localEmergencyNumber || ''} onChange={event => updatePlanField('localEmergencyNumber', event.target.value)} placeholder="Nomor yang sudah Anda verifikasi" className="form-control mt-1.5" />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Sumber resmi / URL
            <input type="url" value={familyPlan.localEmergencySource || ''} onChange={event => updatePlanField('localEmergencySource', event.target.value)} placeholder="https://situs-resmi-daerah.go.id" className="form-control mt-1.5" />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Tanggal terakhir Anda mengecek
            <input type="date" value={familyPlan.localEmergencyCheckedAt || ''} onChange={event => updatePlanField('localEmergencyCheckedAt', event.target.value)} className="form-control mt-1.5" />
          </label>
        </div>
        {familyPlan.localEmergencyNumber && (
          <a href={`tel:${familyPlan.localEmergencyNumber.replace(/[^\d+]/g, '')}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700">
            <PhoneCall className="h-4 w-4" />
            Telepon {familyPlan.localEmergencyName || 'kontak lokal'}
          </a>
        )}
        <p className={`text-[11px] font-semibold ${localEmergencyVerified ? 'text-emerald-800' : 'text-amber-800'}`}>
          {localEmergencyVerified
            ? `Dicek mandiri ${new Date(`${familyPlan.localEmergencyCheckedAt}T00:00:00`).toLocaleDateString('id-ID')} · ${familyPlan.localEmergencySource}`
            : 'Kontak lokal belum terverifikasi: isi sumber resmi dan tanggal cek setelah mengonfirmasi sendiri.'}
        </p>
      </section>

      {/* Family invitation and join panel */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="family-invitation-title"
            className="my-auto max-h-[calc(100vh-1.5rem)] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl border-2 border-[#2196F3] bg-white p-5 shadow-2xl animate-fadeIn"
          >
            <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#2196F3]" />
              <span id="family-invitation-title">Undang atau Gabung Keluarga</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setAddMode('invite'); setScannerOpen(false); setActionError(''); }}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${addMode === 'invite' ? 'bg-white text-[#0D47A1] shadow-sm' : 'text-slate-600'}`}
            >
              Buat undangan
            </button>
            <button
              type="button"
              onClick={() => { setAddMode('join'); setActionError(''); }}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${addMode === 'join' ? 'bg-white text-[#0D47A1] shadow-sm' : 'text-slate-600'}`}
            >
              Gabung via QR/token
            </button>
          </div>

          {addMode === 'invite' ? (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-slate-600">
                Buat token satu kali pakai yang berlaku 24 jam. Bagikan QR atau token ini hanya kepada anggota keluarga yang ingin Anda undang.
              </p>
              <button
                type="button"
                onClick={handleCreateInvite}
                disabled={isFamilySyncBusy}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0D47A1] px-4 py-3 text-sm font-bold text-white hover:bg-[#1565C0] disabled:cursor-wait disabled:opacity-60"
              >
                {isFamilySyncBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                {isFamilySyncBusy
                  ? 'Menyiapkan QR undangan…'
                  : familyInvite
                    ? 'Buat token undangan baru'
                    : 'Coba buat token undangan'}
              </button>

              {familyInvite && (
                <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Token undangan</p>
                      <p className="mt-1 break-all font-mono text-lg font-bold tracking-wider text-[#0D47A1]">{familyInvite.token}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(familyInvite.token, 'Token')}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <Copy className="h-4 w-4" /> Salin token
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(familyInvite.url, 'Tautan undangan')}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <ExternalLink className="h-4 w-4" /> Salin tautan
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Kedaluwarsa {new Date(familyInvite.expiresAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}. Token akan hangus setelah satu anggota bergabung.
                    </p>
                  </div>
                  {qrImage ? (
                    <img src={qrImage} alt="QR code undangan grup keluarga" className="mx-auto h-40 w-40 rounded-lg bg-white p-2" />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-white text-xs text-slate-500">
                      Menyiapkan QR…
                    </div>
                  )}
                </div>
              )}
              {copyStatus && <p role="status" className="text-xs text-emerald-800">{copyStatus}</p>}
            </div>
          ) : (
            <form onSubmit={handleJoinGroup} className="space-y-3">
              <p className="text-xs leading-relaxed text-slate-600">
                Pindai QR undangan atau masukkan token. Data keluarga di perangkat ini akan diganti dengan data grup setelah berhasil bergabung.
              </p>
              <div className="flex gap-2">
                <label className="min-w-0 flex-1 text-xs font-semibold text-slate-700">
                  Token undangan
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={inviteToken}
                    onChange={event => setInviteToken(event.target.value.toLowerCase())}
                    placeholder="Tempel token atau tautan undangan"
                    className="form-control mt-1.5 font-mono"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setScannerOpen(open => !open)}
                  className="mt-5 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#0D47A1] px-3 py-2 text-xs font-bold text-[#0D47A1] hover:bg-blue-50"
                >
                  {scannerOpen ? <Camera className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}
                  {scannerOpen ? 'Tutup kamera' : 'Scan QR'}
                </button>
              </div>

              {scannerOpen && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-950 p-2">
                  <video ref={videoRef} autoPlay muted playsInline className="max-h-64 w-full rounded-lg object-cover" />
                  {scannerError && <p role="alert" className="p-2 text-xs text-white">{scannerError}</p>}
                  {!scannerError && <p className="p-2 text-xs text-white">Arahkan kamera ke QR undangan keluarga.</p>}
                </div>
              )}

              <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
                Nama anggota akan menggunakan nama akun: <strong>{currentUser.name}</strong>.
              </p>
              <label className="block text-xs font-semibold text-slate-700">
                Hubungan / peran
                <select
                  value={newRelationship}
                  onChange={event => setNewRelationship(event.target.value)}
                  className="form-control mt-1.5 bg-white"
                >
                  <option value="Anggota Keluarga">Anggota Keluarga</option>
                  <option value="Orang Tua / Lansia">Orang Tua / Lansia</option>
                  <option value="Anak / Balita">Anak / Balita</option>
                  <option value="Pasangan">Pasangan</option>
                  <option value="Kerabat / Tetangga">Kerabat / Tetangga</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Kebutuhan bantuan khusus (opsional)
                <input
                  type="text"
                  maxLength={500}
                  value={newNeeds}
                  onChange={event => setNewNeeds(event.target.value)}
                  placeholder="Contoh: bantuan mobilitas atau obat rutin"
                  className="form-control mt-1.5"
                />
              </label>

              {(actionError || familySyncError) && (
                <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800">
                  {actionError || familySyncError}
                </p>
              )}
              <button
                type="submit"
                disabled={isFamilySyncBusy || !inviteToken.trim()}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0D47A1] px-4 py-3 text-sm font-bold text-white hover:bg-[#1565C0] disabled:cursor-wait disabled:opacity-60"
              >
                {isFamilySyncBusy && <RefreshCw className="h-4 w-4 animate-spin" />}
                Gabung ke grup keluarga
              </button>
            </form>
          )}
          {familySyncError && addMode === 'invite' && (
            <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{actionError || familySyncError}</p>
          )}
          </section>
        </div>,
        document.body
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
