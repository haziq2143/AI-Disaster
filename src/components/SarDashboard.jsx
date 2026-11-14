'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Pencil, 
  RefreshCw, 
  ShieldCheck, 
  Users, 
  Radio, 
  Trash2, 
  ShieldAlert,
  Zap,
  Crosshair,
  Compass,
  Home,
  Search,
  Bell,
  Download,
  LayoutDashboard,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle,
  Phone,
  Shield,
  X,
  ChevronRight,
  Plus,
  Filter,
  Check,
  Flame,
  Waves,
  Mountain,
  LogOut,
  ExternalLink,
  Navigation
} from 'lucide-react';
import GuardianShieldLogo from './GuardianShieldLogo';
import { isRouteEligiblePosko } from '../lib/poskoManagement.js';

const MapLocationPickerModal = dynamic(() => import('./MapLocationPickerModal'), {
  ssr: false
});

const UnifiedSarOperationsMap = dynamic(() => import('./UnifiedSarOperationsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-2xl bg-slate-100 flex flex-col items-center justify-center p-4 text-slate-500 animate-pulse border border-slate-200">
      <Compass className="w-8 h-8 text-blue-600 animate-spin mb-2" />
      <span className="font-bold text-xs text-slate-700">Menghubungkan Peta Operasi SAR...</span>
    </div>
  )
});

async function readJson(response) {
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Permintaan gagal.');
  return result;
}

export default function SarDashboard({ currentUser, onSwitchToCitizenView }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'map' | 'triage' | 'posko' | 'zones' | 'users'
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [poskos, setPoskos] = useState([]);
  const [zones, setZones] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [triageFilter, setTriageFilter] = useState('all'); // 'all' | 'trapped' | 'critical' | 'in_progress' | 'resolved'
  const [dispatchModalReport, setDispatchModalReport] = useState(null);
  const [dispatchTeam, setDispatchTeam] = useState('Regu SAR Alpha 01');
  const [dispatchEta, setDispatchEta] = useState('15');
  const [editingPoskoId, setEditingPoskoId] = useState(null);
  const [poskoDraft, setPoskoDraft] = useState(null);
  const [sarMapMode, setSarMapMode] = useState('zone'); // 'zone' | 'posko'
  const [hasRealGps, setHasRealGps] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const fetchInitialSarGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setHasRealGps(true);
        setNewZone(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
        setPosko(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
      },
      () => {
        setIsGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    fetchInitialSarGps();
  }, [fetchInitialSarGps]);

  const [posko, setPosko] = useState({ name: '', lat: '-6.9175', lng: '107.6191', address: '', contact: '', current_occupancy: 0, max_capacity: 100 });
  const [newZone, setNewZone] = useState({
    name: '',
    hazard_type: 'gempa',
    severity_level: 'level_3_critical',
    lat: '-6.9175',
    lng: '107.6191',
    radius_km: '2.5',
    description: ''
  });

  const [pickerModal, setPickerModal] = useState({
    isOpen: false,
    target: null, // 'zone' | 'posko' | 'edit_posko'
    lat: -6.9175,
    lng: 107.6191,
    radius: 2.5,
    mode: 'zone',
    title: '',
    hazardType: 'gempa',
    severityLevel: 'level_3_critical'
  });

  const captureGpsFor = (target) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Browser tidak mendukung pembacaan GPS.');
      return;
    }
    setBusy(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        if (target === 'zone') {
          setNewZone(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
          setNotice(`Koordinat GPS zona berhasil diambil: ${lat}, ${lng}`);
        } else if (target === 'posko') {
          setPosko(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
          setNotice(`Koordinat GPS posko berhasil diambil: ${lat}, ${lng}`);
        } else if (target === 'edit_posko') {
          setPoskoDraft(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
          setNotice(`Koordinat GPS posko berhasil diperbarui: ${lat}, ${lng}`);
        }
      },
      () => {
        setBusy(false);
        setError('Gagal membaca GPS perangkat. Pastikan izin lokasi aktif atau klik "Pilih Titik di Peta".');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const openMapPicker = (target) => {
    if (target === 'zone') {
      setPickerModal({
        isOpen: true,
        target: 'zone',
        lat: Number(newZone.lat) || -6.9175,
        lng: Number(newZone.lng) || 107.6191,
        radius: Number(newZone.radius_km) || 2.5,
        mode: 'zone',
        title: 'Tentukan Titik Pusat Zona Bencana di Peta',
        hazardType: newZone.hazard_type,
        severityLevel: newZone.severity_level
      });
    } else if (target === 'posko') {
      setPickerModal({
        isOpen: true,
        target: 'posko',
        lat: Number(posko.lat) || -6.9175,
        lng: Number(posko.lng) || 107.6191,
        mode: 'posko',
        title: 'Tandai Lokasi Posko Evakuasi Baru di Peta'
      });
    } else if (target === 'edit_posko' && poskoDraft) {
      setPickerModal({
        isOpen: true,
        target: 'edit_posko',
        lat: Number(poskoDraft.lat) || -6.9175,
        lng: Number(poskoDraft.lng) || 107.6191,
        mode: 'posko',
        title: `Ubah Titik Lokasi Posko: ${poskoDraft.name}`
      });
    }
  };

  const handlePickerConfirm = ({ lat, lng, radius_km }) => {
    if (pickerModal.target === 'zone') {
      setNewZone(prev => ({
        ...prev,
        lat: String(lat),
        lng: String(lng),
        ...(radius_km ? { radius_km: String(radius_km) } : {})
      }));
      setNotice(`Titik pusat zona bencana diset dari peta: ${lat}, ${lng} (Radius ${radius_km} km)`);
    } else if (pickerModal.target === 'posko') {
      setPosko(prev => ({
        ...prev,
        lat: String(lat),
        lng: String(lng)
      }));
      setNotice(`Titik lokasi posko diset dari peta: ${lat}, ${lng}`);
    } else if (pickerModal.target === 'edit_posko') {
      setPoskoDraft(prev => ({
        ...prev,
        lat: String(lat),
        lng: String(lng)
      }));
      setNotice(`Koordinat posko berhasil diperbarui dari peta: ${lat}, ${lng}`);
    }
  };

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const requests = [
        fetch('/api/map/emergency-reports', { cache: 'no-store' }).then(readJson),
        fetch('/api/map/markers', { cache: 'no-store' }).then(readJson),
        fetch('/api/map/disaster-zones', { cache: 'no-store' }).then(readJson).catch(() => ({ success: true, data: [] }))
      ];
      if (currentUser?.canManageRoles) {
        requests.push(fetch('/api/auth/users', { cache: 'no-store' }).then(readJson));
      }
      const [reportResult, markerResult, zoneResult, accountResult] = await Promise.all(requests);
      setReports(reportResult.data || []);
      setPoskos(markerResult.data?.posko || []);
      if (zoneResult?.data) setZones(zoneResult.data);
      if (accountResult) setAccounts(accountResult.data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.canManageRoles]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateReport = async (reportId, status, extra = {}) => {
    setBusy(true);
    setError('');
    try {
      await readJson(await fetch(`/api/map/emergency-reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extra })
      }));
      setNotice(
        status === 'in_progress'
          ? `Regu penyelamat ditugaskan (${extra.dispatch_team || 'Tim SAR'}). Status OTW aktif.`
          : status === 'resolved'
            ? 'Laporan ditandai selesai (korban berhasil dievakuasi).'
            : 'Status laporan diperbarui.'
      );
      setDispatchModalReport(null);
      await loadData();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddZone = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await readJson(await fetch('/api/map/disaster-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newZone,
          lat: Number(newZone.lat),
          lng: Number(newZone.lng),
          radius_km: Number(newZone.radius_km)
        })
      }));
      setNewZone({
        name: '',
        hazard_type: 'gempa',
        severity_level: 'level_3_critical',
        lat: '-6.9175',
        lng: '107.6191',
        radius_km: '2.5',
        description: ''
      });
      await loadData();
      setNotice('Zona bencana berhasil ditetapkan. Peringatan dan sistem deteksi korban terjebak (PASS) aktif di area tersebut.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateZoneSeverity = async (zoneId, severity_level) => {
    setBusy(true);
    setError('');
    try {
      await readJson(await fetch(`/api/map/disaster-zones/${encodeURIComponent(zoneId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity_level })
      }));
      setNotice('Level bahaya zona bencana berhasil diubah.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Hapus atau selesaikan status zona bencana ini?')) return;
    setBusy(true);
    setError('');
    try {
      await readJson(await fetch(`/api/map/disaster-zones/${encodeURIComponent(zoneId)}`, {
        method: 'DELETE'
      }));
      setNotice('Zona bencana telah diselesaikan/dihapus.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addPosko = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await readJson(await fetch('/api/map/markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...posko,
          lat: Number(posko.lat),
          lng: Number(posko.lng)
        })
      }));
      setPosko({ name: '', lat: '-6.9175', lng: '107.6191', address: '', contact: '', current_occupancy: 0, max_capacity: 100 });
      await loadData();
      setNotice('Posko ditambahkan. Konfirmasi dulu bahwa posko beroperasi, lalu tandai sudah dicek agar bisa dipakai sebagai tujuan rute.');
    } catch (addError) {
      setError(addError.message);
    } finally {
      setBusy(false);
    }
  };

  const updatePosko = async (poskoId, updates, successMessage) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await readJson(await fetch(`/api/map/markers/${encodeURIComponent(poskoId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }));
      setEditingPoskoId(null);
      setPoskoDraft(null);
      await loadData();
      setNotice(successMessage);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy(false);
    }
  };

  const startEditingPosko = item => {
    setEditingPoskoId(item.id);
    setPoskoDraft({
      name: item.name,
      address: item.address,
      lat: String(item.lat),
      lng: String(item.lng),
      contact: item.contact === 'Belum diinformasikan' ? '' : item.contact,
      current_occupancy: item.current_occupancy !== undefined ? item.current_occupancy : 0,
      max_capacity: item.max_capacity !== undefined ? item.max_capacity : 100
    });
  };

  const savePoskoDraft = event => {
    event.preventDefault();
    updatePosko(editingPoskoId, {
      ...poskoDraft,
      lat: Number(poskoDraft.lat),
      lng: Number(poskoDraft.lng),
      current_occupancy: Number(poskoDraft.current_occupancy) || 0,
      max_capacity: Number(poskoDraft.max_capacity) || 100
    }, 'Detail posko diperbarui. Posko perlu dicek ulang sebelum dipakai sebagai tujuan rute.');
  };

  const updateRole = async (userId, role) => {
    setError('');
    try {
      await readJson(await fetch('/api/auth/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      }));
      setNotice('Role akun diperbarui.');
      await loadData();
    } catch (roleError) {
      setError(roleError.message);
    }
  };

  const downloadSarLog = () => {
    const data = {
      export_date: new Date().toISOString(),
      sar_officer: currentUser?.name || 'Petugas SAR',
      total_reports: reports.length,
      total_poskos: poskos.length,
      total_zones: zones.length,
      reports,
      poskos,
      zones
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evacu8-sar-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Data log operasi SAR berhasil diunduh.');
  };

  // Key metrics calculation
  const totalOccupancy = useMemo(() => poskos.reduce((sum, p) => sum + (Number(p.current_occupancy) || 0), 0), [poskos]);
  const totalCapacity = useMemo(() => poskos.reduce((sum, p) => sum + (Number(p.max_capacity) || 100), 0) || 100, [poskos]);
  const occupancyPercent = useMemo(() => Math.min(100, Math.round((totalOccupancy / totalCapacity) * 100)), [totalOccupancy, totalCapacity]);

  const trappedReportsCount = useMemo(() => reports.filter(r => r.needs_description?.includes('[AUTO-TRIGGER PASS]')).length, [reports]);
  const criticalReportsCount = useMemo(() => reports.filter(r => r.urgency_level === 'KRITIS' || r.vulnerable_members?.includes('Bayi') || r.vulnerable_members?.includes('Lansia')).length, [reports]);
  const inProgressCount = useMemo(() => reports.filter(r => r.status === 'in_progress').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'resolved').length, [reports]);

  // Filtered lists
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          report.reporter_name?.toLowerCase().includes(q) ||
          report.needs_description?.toLowerCase().includes(q) ||
          report.hazard_type?.toLowerCase().includes(q) ||
          report.contact?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (triageFilter === 'trapped') return report.needs_description?.includes('[AUTO-TRIGGER PASS]');
      if (triageFilter === 'critical') return report.urgency_level === 'KRITIS' || report.vulnerable_members?.includes('Bayi') || report.vulnerable_members?.includes('Lansia');
      if (triageFilter === 'in_progress') return report.status === 'in_progress';
      if (triageFilter === 'resolved') return report.status === 'resolved';
      return true;
    });
  }, [reports, searchQuery, triageFilter]);

  const filteredPoskos = useMemo(() => {
    if (!searchQuery.trim()) return poskos;
    const q = searchQuery.toLowerCase();
    return poskos.filter(p => p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q));
  }, [poskos, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-[#F4F7FB] text-slate-800 flex flex-col xl:flex-row antialiased relative">
      
      {/* MOBILE TOP HEADER BAR (xl:hidden) */}
      <div className="xl:hidden bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <GuardianShieldLogo size={18} />
          </div>
          <div>
            <span className="text-xs font-black text-slate-900 leading-none block">Evacu8 SAR</span>
            <span className="text-[9px] font-bold text-slate-400">Command Center</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Siaga 1
          </span>

          {onSwitchToCitizenView && (
            <button
              type="button"
              onClick={onSwitchToCitizenView}
              className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Warga</span>
            </button>
          )}
        </div>
      </div>

      {/* COLUMN 1: FULL-HEIGHT LEFT SIDEBAR NAVIGATION (FIXED / STICKY ON DESKTOP) */}
      <aside className="hidden xl:flex xl:w-64 xl:h-screen xl:sticky xl:top-0 bg-white border-r border-slate-200/80 p-5 flex-col justify-between shrink-0 shadow-xs z-20 overflow-y-auto">
        <div>
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GuardianShieldLogo size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight leading-none">
                Evacu8 <span className="text-blue-600">SAR</span>
              </h2>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Command Center</p>
            </div>
          </div>

          {/* Quick Dual-View Switcher to Citizen View */}
          {onSwitchToCitizenView && (
            <button
              type="button"
              onClick={onSwitchToCitizenView}
              className="w-full mt-5 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
              title="Buka tampilan aplikasi dari sudut pandang warga biasa"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>Tampilan Warga</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}

          {/* Navigation Menu */}
          <nav className="mt-6 space-y-1.5" aria-label="SAR Navigation">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Peta Operasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('triage')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'triage'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4" />
                <span>Triase Laporan</span>
              </div>
              {criticalReportsCount + trappedReportsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === 'triage' ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                }`}>
                  {criticalReportsCount + trappedReportsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('posko')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'posko'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4" />
                <span>Posko Evakuasi</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'posko' ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'
              }`}>
                {poskos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('zones')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'zones'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4" />
                <span>Zonasi Bahaya</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'zones' ? 'bg-white text-blue-600' : 'bg-rose-100 text-rose-700'
              }`}>
                {zones.length}
              </span>
            </button>

            {currentUser?.canManageRoles && (
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Akses Petugas</span>
              </button>
            )}
          </nav>
        </div>

        {/* Bottom Promo / Download Card (Mooney Style) */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50/80 rounded-3xl p-4 border border-blue-100/80 space-y-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-600/10 text-blue-700 flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 leading-snug">Laporan Operasi 2026</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Rekapitulasi log SAR terenkripsi</p>
          </div>
          <button
            type="button"
            onClick={downloadSarLog}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
          >
            Unduh Log (.JSON)
          </button>
        </div>
      </aside>

      {/* COLUMN 2: CENTER EXPANSIVE MAIN CONTENT (FULL VW/VH RESPONSIVE) */}
      <main className="flex-1 min-h-screen p-4 sm:p-6 lg:p-8 pb-28 xl:pb-8 space-y-6 overflow-y-auto">
        
        {/* Top Notifications Banner */}
        {error && (
          <div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-800 flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {error}
            </span>
            <button type="button" onClick={() => setError('')} className="text-rose-600 hover:text-rose-800 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              {notice}
            </span>
            <button type="button" onClick={() => setNotice('')} className="text-emerald-600 hover:text-emerald-800 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Search Bar & Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[260px] max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama korban, posko, atau ID laporan..."
              className="w-full bg-white hover:bg-slate-50 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:outline-none shadow-2xs transition-all"
            />
          </div>

          {/* Status Pill & Notifications */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-emerald-800 text-[11px] font-black shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Siaga 1 Aktif</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('triage');
                setTriageFilter('trapped');
              }}
              className="relative p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              title="Notifikasi Korban Terjebak"
            >
              <Bell className="w-4 h-4" />
              {trappedReportsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              )}
            </button>

            {onSwitchToCitizenView && (
              <button
                type="button"
                onClick={onSwitchToCitizenView}
                className="xl:hidden px-3 py-2 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Warga</span>
              </button>
            )}
          </div>
        </div>

        {/* View Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === 'overview' && 'Dashboard Operasi SAR'}
              {activeTab === 'map' && 'Peta Tunggal & Operasi Lapangan'}
              {activeTab === 'triage' && 'Triase & Respons Korban Darurat'}
              {activeTab === 'posko' && 'Manajemen Posko & Kuota Pengungsi'}
              {activeTab === 'zones' && 'Zonasi Bahaya & Radius PASS'}
              {activeTab === 'users' && 'Manajemen Hak Akses Petugas SAR'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem Terpadu Komando Bencana Real-Time Evacu8
            </p>
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={loadData}
            disabled={busy}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* TAB CONTENT: OVERVIEW (FULL-WIDTH SAAS MOONEY STYLE) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* ROW 1: Featured Blue Gradient Card + Line Chart Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left: Deep Royal Blue Gradient Featured Card (Mooney Balance Card Style) */}
              <div className="md:col-span-6 bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] text-white rounded-3xl p-6 shadow-xl shadow-blue-600/15 relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                    Status Siaga SAR
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/90 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                    SIAGA 1 (KRITIS)
                  </span>
                </div>

                <div className="my-2 relative z-10">
                  <p className="text-3xl sm:text-4xl font-black tracking-tight">
                    {criticalReportsCount + trappedReportsCount} Kasus
                  </p>
                  <p className="text-xs text-blue-100 font-semibold mt-1">
                    Menunggu Penanganan Tim Penyelamat
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-blue-200 border-t border-white/15 pt-3 relative z-10">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-blue-300 block font-bold">KODE DISPATCH</span>
                    <span className="font-extrabold text-white">BASARNAS-01</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-blue-300 block font-bold">KOMANDAN</span>
                    <span className="font-extrabold text-white">{currentUser?.name || 'Petugas SAR'}</span>
                  </div>
                </div>
              </div>

              {/* Right: Trend & Line Chart Card (Mooney Exchange Rates Style) */}
              <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[200px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900">Aktivitas Laporan & Respon</p>
                    <p className="text-[10px] text-slate-400">Tren jam-ke-jam hari ini</p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    24 JAM TERAKHIR
                  </span>
                </div>

                {/* Smooth Spline SVG Line Chart */}
                <div className="my-2 py-1">
                  <svg viewBox="0 0 320 90" className="w-full h-20 overflow-visible">
                    <defs>
                      <linearGradient id="mooneyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10,65 C 60,60 90,75 130,40 C 170,10 200,55 240,25 C 270,12 290,18 310,20 L 310,85 L 10,85 Z"
                      fill="url(#mooneyGradient)"
                    />
                    <path
                      d="M 10,65 C 60,60 90,75 130,40 C 170,10 200,55 240,25 C 270,12 290,18 310,20"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <circle cx="240" cy="25" r="5.5" fill="#F43F5E" className="animate-ping" opacity="0.75" />
                    <circle cx="240" cy="25" r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
                  </svg>

                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 px-1 pt-1">
                    <span>06:00</span>
                    <span>09:00</span>
                    <span>12:00</span>
                    <span>15:00</span>
                    <span>18:00</span>
                    <span>21:00</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Tingkat keberhasilan evakuasi</span>
                  <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {resolvedCount} Korban Tertangani
                  </span>
                </div>
              </div>

            </div>

            {/* ROW 2: PUSAT PETA OPERASI TUNGGAL */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    <h2 className="text-base font-black text-slate-900">
                      Pusat Operasi Peta & Penandaan Lapangan
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Klik langsung di peta untuk menandai perimeter zona bencana atau mendirikan posko pengungsian baru.
                  </p>
                </div>

                {/* Mode Toggle Pills */}
                <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSarMapMode('zone')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      sarMapMode === 'zone'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-rose-700'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Zona Bencana</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSarMapMode('posko')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      sarMapMode === 'posko'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-800'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Posko Baru</span>
                  </button>
                </div>
              </div>

              {/* The Single Unified Map */}
              <UnifiedSarOperationsMap
                currentMode={sarMapMode}
                activeLat={sarMapMode === 'zone' ? (newZone.lat || -6.9175) : (posko.lat || -6.9175)}
                activeLng={sarMapMode === 'zone' ? (newZone.lng || 107.6191) : (posko.lng || 107.6191)}
                radiusKm={newZone.radius_km || 2.5}
                severityLevel={newZone.severity_level}
                reports={reports}
                poskos={poskos}
                zones={zones}
                isGpsLoading={isGpsLoading}
                onRefreshGps={fetchInitialSarGps}
                hasRealGps={hasRealGps}
                onLocationChange={({ lat, lng }) => {
                  if (sarMapMode === 'zone') {
                    setNewZone(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
                  } else {
                    setPosko(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
                  }
                }}
              />

              {/* Form Sesuai Opsi yang Aktif */}
              {sarMapMode === 'zone' ? (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                      Tetapkan Radius Bahaya & Peringatan Warga
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                      {zones.length} Zona Terdata
                    </span>
                  </div>

                  <form onSubmit={handleAddZone} className="grid gap-3 sm:grid-cols-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-[11px] font-bold text-slate-700">Nama Zona Bencana
                      <input required maxLength={120} placeholder="Contoh: Zona Merah Sesar Lembang RW 04" value={newZone.name} onChange={e => setNewZone({ ...newZone, name: e.target.value })} className="form-control mt-1 text-xs" />
                    </label>

                    <label className="text-[11px] font-bold text-slate-700">Jenis Bencana
                      <select value={newZone.hazard_type} onChange={e => setNewZone({ ...newZone, hazard_type: e.target.value })} className="form-control mt-1 bg-white text-xs">
                        <option value="gempa">Gempa Bumi (Struktur Roboh)</option>
                        <option value="banjir">Banjir Bandang / Luapan</option>
                        <option value="longsor">Tanah Longsor</option>
                        <option value="erupsi">Erupsi Gunung Berapi</option>
                        <option value="kebakaran">Kebakaran Hutan / Pemukiman</option>
                      </select>
                    </label>

                    <label className="text-[11px] font-bold text-slate-700">Level Bahaya
                      <select value={newZone.severity_level} onChange={e => setNewZone({ ...newZone, severity_level: e.target.value })} className="form-control mt-1 bg-white font-bold text-xs">
                        <option value="level_3_critical" className="text-rose-700 font-bold">Level 3: AWAS (Auto PASS Terjebak Aktif)</option>
                        <option value="level_2_warning" className="text-amber-700 font-bold">Level 2: SIAGA (Tingkat Sedang)</option>
                        <option value="level_1_advisory" className="text-blue-700 font-bold">Level 1: WASPADA (Pantauan)</option>
                      </select>
                    </label>

                    <label className="text-[11px] font-bold text-slate-700">Radius Dampak (KM)
                      <input required type="number" step="0.1" min="0.2" max="50" placeholder="2.5" value={newZone.radius_km} onChange={e => setNewZone({ ...newZone, radius_km: e.target.value })} className="form-control mt-1 text-xs" />
                    </label>

                    <div className="sm:col-span-2 flex items-center justify-between text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                      <span>Titik Pusat: <strong>{newZone.lat}</strong>, <strong>{newZone.lng}</strong></span>
                      <button
                        type="button"
                        onClick={() => captureGpsFor('zone')}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        Kunci GPS Saya
                      </button>
                    </div>

                    <label className="text-[11px] font-bold text-slate-700 sm:col-span-2">Deskripsi Dampak & Arahan Lapangan
                      <input maxLength={250} placeholder="Contoh: Reruntuhan padat, dicurigai banyak korban tertimbun." value={newZone.description} onChange={e => setNewZone({ ...newZone, description: e.target.value })} className="form-control mt-1 text-xs" />
                    </label>

                    <button disabled={busy} className="min-h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all sm:col-span-2 cursor-pointer disabled:opacity-50">
                      {busy ? 'Menetapkan...' : 'Tetapkan & Aktifkan Zona Bencana'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-blue-600" />
                      Tambah & Registrasi Posko Baru
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {poskos.length} Posko Terdaftar
                    </span>
                  </div>

                  <form onSubmit={addPosko} className="grid gap-3 sm:grid-cols-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-[11px] font-bold text-slate-700">Nama Posko
                      <input required maxLength={120} placeholder="Contoh: Posko Balai Desa Mekarwangi" value={posko.name} onChange={e => setPosko({ ...posko, name: e.target.value })} className="form-control mt-1 text-xs" />
                    </label>
                    <label className="text-[11px] font-bold text-slate-700">Alamat / Area
                      <input required maxLength={200} placeholder="Contoh: Jl. Raya Lembang No. 12" value={posko.address} onChange={e => setPosko({ ...posko, address: e.target.value })} className="form-control mt-1 text-xs" />
                    </label>

                    <div className="sm:col-span-2 flex items-center justify-between text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                      <span>Titik Posko: <strong>{posko.lat}</strong>, <strong>{posko.lng}</strong></span>
                      <button
                        type="button"
                        onClick={() => captureGpsFor('posko')}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        Kunci GPS Saya
                      </button>
                    </div>

                    <label className="text-[11px] font-bold text-slate-700 sm:col-span-2">Kontak Posko (Opsional)
                      <input maxLength={100} placeholder="Contoh: 0812-3456-7890 (Bpk. Agus / Radio SAR Ch-08)" value={posko.contact} onChange={e => setPosko({ ...posko, contact: e.target.value })} className="form-control mt-1 text-xs" />
                    </label>

                    <button disabled={busy} className="min-h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all sm:col-span-2 cursor-pointer disabled:opacity-50">
                      {busy ? 'Menyimpan...' : 'Daftarkan Posko ke Database'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* ROW 3: POSKO EFFICIENCY & CAPACITY GAUGE */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Efisiensi Daya Tampung Posko</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kapasitas pengungsi kumulatif di seluruh posko terverifikasi
                </p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-slate-600">Terisi: <strong>{totalOccupancy} Jiwa</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-200" />
                    <span className="text-slate-600">Sisa Kuota: <strong>{Math.max(0, totalCapacity - totalOccupancy)} Jiwa</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('posko')}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <span>Kelola & update kuota posko</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Circular Donut Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#2563EB"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 38}
                    strokeDashoffset={2 * Math.PI * 38 * (1 - occupancyPercent / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900">{occupancyPercent}%</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Terisi</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB CONTENT: MAP ONLY VIEW */}
        {activeTab === 'map' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Operasi Peta Skala Penuh</h2>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setSarMapMode('zone')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${sarMapMode === 'zone' ? 'bg-rose-600 text-white' : 'text-slate-600'}`}
                >
                  Mode Zona
                </button>
                <button
                  type="button"
                  onClick={() => setSarMapMode('posko')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${sarMapMode === 'posko' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                >
                  Mode Posko
                </button>
              </div>
            </div>

            <div className="min-h-[550px]">
              <UnifiedSarOperationsMap
                currentMode={sarMapMode}
                activeLat={sarMapMode === 'zone' ? (newZone.lat || -6.9175) : (posko.lat || -6.9175)}
                activeLng={sarMapMode === 'zone' ? (newZone.lng || 107.6191) : (posko.lng || 107.6191)}
                radiusKm={newZone.radius_km || 2.5}
                severityLevel={newZone.severity_level}
                reports={reports}
                poskos={poskos}
                zones={zones}
                isGpsLoading={isGpsLoading}
                onRefreshGps={fetchInitialSarGps}
                hasRealGps={hasRealGps}
                onLocationChange={({ lat, lng }) => {
                  if (sarMapMode === 'zone') {
                    setNewZone(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
                  } else {
                    setPosko(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* TAB CONTENT: TRIAGE FULL VIEW */}
        {activeTab === 'triage' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
              {[
                { id: 'all', label: `Semua (${reports.length})` },
                { id: 'trapped', label: `Terjebak PASS (${trappedReportsCount})` },
                { id: 'critical', label: `Kritis/Rentan (${criticalReportsCount})` },
                { id: 'in_progress', label: `Menuju Lokasi (${inProgressCount})` },
                { id: 'resolved', label: `Berhasil Dievakuasi (${resolvedCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTriageFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    triageFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading && <p className="text-xs text-slate-500 py-4">Memuat data laporan...</p>}
            {!loading && filteredReports.length === 0 && (
              <p className="text-xs text-slate-400 py-8 text-center italic">Tidak ada laporan yang sesuai kriteria.</p>
            )}

            <div className="space-y-3">
              {filteredReports.map(report => (
                <article
                  key={report.id}
                  className={`space-y-3 rounded-2xl border p-4 transition-all ${
                    report.needs_description?.includes('[AUTO-TRIGGER PASS]')
                      ? 'border-rose-400 bg-rose-50/70 shadow-xs'
                      : report.status === 'in_progress'
                        ? 'border-blue-300 bg-blue-50/50'
                        : report.status === 'resolved'
                          ? 'border-emerald-200 bg-emerald-50/40 opacity-80'
                          : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-slate-900">{report.reporter_name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          report.urgency_level === 'KRITIS' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {report.urgency_level}
                        </span>
                        {report.needs_description?.includes('[AUTO-TRIGGER PASS]') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-700 text-white font-black text-[10px] animate-pulse">
                            <Radio className="w-3 h-3" />
                            KORBAN TERJEBAK (AUTO-TRIGGER)
                          </span>
                        )}
                        {report.status === 'in_progress' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px]">
                            <Navigation className="w-3 h-3" />
                            <span>BANTUAN MENUJU LOKASI (OTW)</span>
                          </span>
                        )}
                        {report.status === 'resolved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>DIEVAKUASI</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{report.hazard_type} · {report.reported_at || 'Baru saja'}</p>
                    </div>
                    <p className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      <MapPin className="h-3.5 w-3.5 text-rose-600" />
                      {Number(report.lat).toFixed(4)}, {Number(report.lng).toFixed(4)}
                    </p>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed font-medium">{report.needs_description}</p>
                  <p className="text-xs text-slate-600">Kebutuhan rentan: <strong>{report.vulnerable_members}</strong> · Kontak: {report.contact}</p>

                  {report.status === 'in_progress' && (
                    <div className="rounded-xl border border-blue-200 bg-blue-100/60 p-3 text-xs text-blue-950 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                        <span>Regu Ditugaskan: <strong>{report.dispatch_team || 'Tim SAR Lapangan'}</strong></span>
                      </div>
                      <span>Estimasi Tiba: <strong>{report.eta_minutes || 15} Menit</strong></span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {report.status !== 'in_progress' && report.status !== 'resolved' && (
                      <button
                        disabled={busy}
                        onClick={() => {
                          setDispatchModalReport(report);
                          setDispatchTeam('Regu SAR Alpha 01');
                          setDispatchEta('15');
                        }}
                        className="min-h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Tugaskan Regu Penolong (OTW)</span>
                      </button>
                    )}
                    {report.status === 'in_progress' && (
                      <button
                        disabled={busy}
                        onClick={() => updateReport(report.id, 'resolved')}
                        className="min-h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tandai Berhasil Dievakuasi</span>
                      </button>
                    )}
                    {report.status === 'resolved' && (
                      <button
                        disabled={busy}
                        onClick={() => updateReport(report.id, 'waiting_rescue')}
                        className="min-h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Buka Kembali Laporan
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: POSKO FULL VIEW */}
        {activeTab === 'posko' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Daftar Posko & Kapasitas</h2>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setSarMapMode('posko');
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Posko
              </button>
            </div>

            <div className="space-y-4">
              {filteredPoskos.map(item => {
                const routeEligible = isRouteEligiblePosko(item);
                const isEditing = editingPoskoId === item.id;
                const statusText = routeEligible
                  ? 'Buka · Dicek Tim SAR, siap ditawarkan sebagai rute'
                  : item.operational_status === 'closed'
                    ? 'Ditutup · Tidak tersedia sebagai tujuan rute'
                    : item.operational_status === 'open'
                      ? 'Buka · Menunggu verifikasi fisik Tim SAR'
                      : 'Status belum dikonfirmasi';

                return (
                  <article key={item.id} className="space-y-3 rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900">{item.name}</h3>
                        <p className={`mt-0.5 text-xs font-bold ${routeEligible ? 'text-emerald-700' : 'text-amber-700'}`}>{statusText}</p>
                        <p className="mt-1 text-xs text-slate-600">{item.address}</p>
                        <p className="text-xs text-slate-500">Kontak: {item.contact || 'Belum diinformasikan'}</p>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold">{Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Kapasitas Pengungsi:</span>
                        <span className="font-extrabold text-slate-900">
                          {item.current_occupancy || 0} / {item.max_capacity || 100} Jiwa
                          <span className="ml-1 text-[11px] text-slate-500 font-semibold">
                            ({Math.round(((item.current_occupancy || 0) / (item.max_capacity || 100)) * 100)}% Terisi)
                          </span>
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            ((item.current_occupancy || 0) / (item.max_capacity || 100)) >= 0.9
                              ? 'bg-rose-600'
                              : ((item.current_occupancy || 0) / (item.max_capacity || 100)) >= 0.7
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.round(((item.current_occupancy || 0) / (item.max_capacity || 100)) * 100))}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-1 text-xs gap-2">
                        <span className="text-[11px] text-slate-500">Update Cepat Kuota:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busy || (item.current_occupancy || 0) <= 0}
                            onClick={() => updatePosko(item.id, { current_occupancy: Math.max(0, (item.current_occupancy || 0) - 5) }, 'Jumlah pengungsi dikurangi (-5).')}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-extrabold text-[11px] text-slate-700 disabled:opacity-40 cursor-pointer"
                          >
                            - 5 Jiwa
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => updatePosko(item.id, { current_occupancy: (item.current_occupancy || 0) + 5 }, 'Jumlah pengungsi ditambahkan (+5).')}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-extrabold text-[11px] text-slate-700 disabled:opacity-40 cursor-pointer"
                          >
                            + 5 Jiwa
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => startEditingPosko(item)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Ubah Detail
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updatePosko(item.id, {
                          operational_status: item.operational_status === 'open' ? 'closed' : 'open'
                        }, item.operational_status === 'open' ? 'Posko ditutup.' : 'Posko dibuka.')}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {item.operational_status === 'open' ? 'Tutup Posko' : 'Tandai Buka'}
                      </button>

                      <button
                        type="button"
                        disabled={busy || item.operational_status !== 'open'}
                        onClick={() => updatePosko(item.id, {
                          verification_status: item.verification_status === 'sar_checked' ? 'pending' : 'sar_checked'
                        }, item.verification_status === 'sar_checked' ? 'Pengecekan dibatalkan.' : 'Posko diverifikasi siap.')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          item.verification_status === 'sar_checked'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.verification_status === 'sar_checked' ? 'Minta Cek Ulang' : 'Tandai Sudah Dicek'}
                      </button>
                    </div>

                    {isEditing && poskoDraft && (
                      <form onSubmit={savePoskoDraft} className="grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 bg-white p-3 rounded-xl">
                        <label className="text-xs font-bold text-slate-700">Nama posko
                          <input required value={poskoDraft.name} onChange={e => setPoskoDraft({ ...poskoDraft, name: e.target.value })} className="form-control mt-1 text-xs" />
                        </label>
                        <label className="text-xs font-bold text-slate-700">Alamat
                          <input required value={poskoDraft.address} onChange={e => setPoskoDraft({ ...poskoDraft, address: e.target.value })} className="form-control mt-1 text-xs" />
                        </label>
                        <label className="text-xs font-bold text-slate-700">Pengungsi Saat Ini
                          <input type="number" min="0" value={poskoDraft.current_occupancy} onChange={e => setPoskoDraft({ ...poskoDraft, current_occupancy: e.target.value })} className="form-control mt-1 text-xs" />
                        </label>
                        <label className="text-xs font-bold text-slate-700">Kapasitas Maksimal
                          <input type="number" min="1" value={poskoDraft.max_capacity} onChange={e => setPoskoDraft({ ...poskoDraft, max_capacity: e.target.value })} className="form-control mt-1 text-xs" />
                        </label>
                        <div className="flex gap-2 sm:col-span-2">
                          <button disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">Simpan</button>
                          <button type="button" onClick={() => { setEditingPoskoId(null); setPoskoDraft(null); }} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer">Batal</button>
                        </div>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB CONTENT: ZONES FULL VIEW */}
        {activeTab === 'zones' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Daftar Zona Bencana Aktif</h2>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setSarMapMode('zone');
                }}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tetapkan Zona Baru
              </button>
            </div>

            <div className="space-y-3">
              {zones.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center italic">Belum ada zona bencana aktif.</p>
              ) : (
                zones.map(z => {
                  const isLevel3 = z.severity_level === 'level_3_critical';
                  return (
                    <div key={z.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${
                              isLevel3 ? 'bg-rose-600' : 'bg-amber-600'
                            }`}>
                              {z.severity_label || z.severity_level}
                            </span>
                            <h3 className="font-extrabold text-slate-900">{z.name}</h3>
                            <span className="text-xs text-slate-500 font-semibold uppercase">({z.hazard_type})</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{z.description}</p>
                          <p className="text-[11px] text-slate-400">Titik: {z.lat}, {z.lng} · Radius: <strong>{z.radius_km} km</strong></p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteZone(z.id)}
                          className="px-3 py-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Selesaikan
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: ADMIN USERS VIEW */}
        {activeTab === 'users' && currentUser?.canManageRoles && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900">Kelola Akses Tim SAR</h2>
            <div className="space-y-2">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">{account.name}</p>
                    <p className="text-[11px] text-slate-500">{account.email}</p>
                  </div>
                  <select
                    disabled={account.canManageRoles}
                    value={account.role}
                    onChange={e => updateRole(account.id, e.target.value)}
                    className="text-xs rounded-xl border border-slate-200 bg-white p-2 font-bold cursor-pointer"
                  >
                    <option value="user">Pengguna</option>
                    <option value="sar">Tim SAR</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* COLUMN 3: RIGHT SIDEBAR (OFFICER PROFILE & RECENT INCOMING SOS - FIXED/STICKY ON DESKTOP) */}
      <aside className="w-full xl:w-80 xl:h-screen xl:sticky xl:top-0 bg-white border-l border-slate-200/80 p-5 sm:p-6 space-y-6 shrink-0 shadow-xs z-10 overflow-y-auto">
        
        {/* Officer Profile Card (Mooney Style) */}
        <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 mx-auto shadow-md">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-xl">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div>
            <h3 className="font-black text-slate-900 text-sm leading-tight">
              {currentUser?.name || 'Komandan SAR'}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              {currentUser?.role === 'sar' ? 'Komandan Lapangan' : 'Petugas Siaga'}
            </p>
          </div>

          {/* Quick Action Button Icons (Mooney Top Up, Pay, Send, Request style) */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/70">
            <button
              type="button"
              onClick={loadData}
              className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Segarkan Data"
            >
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                <RefreshCw className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold">Segarkan</span>
            </button>

            <button
              type="button"
              onClick={() => captureGpsFor('zone')}
              className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Kunci GPS Lapangan"
            >
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                <Crosshair className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold">Kunci GPS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('overview');
                setSarMapMode('posko');
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Tambah Posko"
            >
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                <Home className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold">Posko</span>
            </button>

            <button
              type="button"
              onClick={downloadSarLog}
              className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Unduh Log SAR"
            >
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
                <Download className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold">Ekspor</span>
            </button>
          </div>
        </div>

        {/* Laporan Korban Terbaru / Recent Activity (Mooney Recent Transaction style) */}
        <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900">Laporan Korban Darurat</h3>
              <p className="text-[10px] text-slate-400">Hari ini (Live Feed)</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('triage')}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Semua ({reports.length})
            </button>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center italic">Belum ada laporan masuk.</p>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 6).map(report => {
                const isTrapped = report.needs_description?.includes('[AUTO-TRIGGER PASS]');
                const isOtw = report.status === 'in_progress';
                const isResolved = report.status === 'resolved';

                return (
                  <div
                    key={report.id}
                    className="flex items-start justify-between gap-2.5 p-2.5 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isTrapped
                          ? 'bg-rose-100 text-rose-700'
                          : isOtw
                            ? 'bg-blue-100 text-blue-700'
                            : isResolved
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                      }`}>
                        {report.reporter_name ? report.reporter_name.charAt(0).toUpperCase() : '!'}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {report.reporter_name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {report.needs_description || report.hazard_type}
                        </p>
                        <span className="text-[9px] text-slate-400">
                          {report.reported_at || 'Baru saja'}
                        </span>
                      </div>
                    </div>

                    {/* Status / Quick Action button */}
                    <div className="shrink-0 text-right">
                      {isResolved ? (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <span>Selesai</span>
                          <Check className="w-3 h-3 text-emerald-600" />
                        </span>
                      ) : isOtw ? (
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          OTW ({report.eta_minutes || 15}m)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDispatchModalReport(report);
                            setDispatchTeam('Regu SAR Alpha 01');
                            setDispatchEta('15');
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black shadow-xs cursor-pointer"
                        >
                          Kirim Regu
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </aside>

      {/* Modal Konfirmasi Dispatch Regu Penyelamat */}
      {dispatchModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Tugaskan Regu SAR Lapangan</h3>
              <button type="button" onClick={() => setDispatchModalReport(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menugaskan regu akan menyiarkan status <strong>BANTUAN MENUJU LOKASI (OTW)</strong> ke layar korban untuk memberikan kepastian dan ketenangan.
            </p>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Nama Regu / Satuan
                <input
                  value={dispatchTeam}
                  onChange={e => setDispatchTeam(e.target.value)}
                  className="form-control mt-1"
                  placeholder="Contoh: Regu Alpha 01 (Basarnas)"
                />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Estimasi Waktu Tiba / ETA (Menit)
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={dispatchEta}
                  onChange={e => setDispatchEta(e.target.value)}
                  className="form-control mt-1"
                  placeholder="15"
                />
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDispatchModalReport(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => updateReport(dispatchModalReport.id, 'in_progress', {
                  dispatch_team: dispatchTeam,
                  eta_minutes: Number(dispatchEta) || 15
                })}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Mengirim…' : 'Kirim Regu (Siarkan OTW)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map Picker Modal */}
      <MapLocationPickerModal
        isOpen={pickerModal.isOpen}
        onClose={() => setPickerModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handlePickerConfirm}
        initialLat={pickerModal.lat}
        initialLng={pickerModal.lng}
        initialRadius={pickerModal.radius}
        mode={pickerModal.mode}
        hazardType={pickerModal.hazardType}
        severityLevel={pickerModal.severityLevel}
        title={pickerModal.title}
      />

      {/* FIXED BOTTOM NAV FOR MOBILE VIEW (xl:hidden) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around xl:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'overview' ? 'text-blue-600 font-black' : 'text-slate-500 font-semibold'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px]">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'map' ? 'text-blue-600 font-black' : 'text-slate-500 font-semibold'
          }`}
        >
          <MapPin className={`w-4 h-4 ${activeTab === 'map' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px]">Peta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('triage')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'triage' ? 'text-blue-600 font-black' : 'text-slate-500 font-semibold'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${activeTab === 'triage' ? 'stroke-[2.5]' : ''}`} />
          {criticalReportsCount + trappedReportsCount > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
          <span className="text-[9px]">Triase</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('posko')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'posko' ? 'text-blue-600 font-black' : 'text-slate-500 font-semibold'
          }`}
        >
          <Home className={`w-4 h-4 ${activeTab === 'posko' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px]">Posko ({poskos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'zones' ? 'text-blue-600 font-black' : 'text-slate-500 font-semibold'
          }`}
        >
          <Radio className={`w-4 h-4 ${activeTab === 'zones' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[9px]">Zona ({zones.length})</span>
        </button>

        {onSwitchToCitizenView && (
          <button
            type="button"
            onClick={onSwitchToCitizenView}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-blue-700 bg-blue-50/90 border border-blue-200 transition-all cursor-pointer active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span className="text-[9px] font-black">Warga</span>
          </button>
        )}
      </nav>

    </div>
  );
}
