'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Pencil, 
  RefreshCw, 
  ShieldCheck, 
  Users, 
  Radio, 
  Flame, 
  Activity, 
  Waves, 
  Mountain, 
  Trash2, 
  ShieldAlert,
  Zap
} from 'lucide-react';
import { isRouteEligiblePosko } from '../lib/poskoManagement.js';

async function readJson(response) {
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Permintaan gagal.');
  return result;
}

export default function SarDashboard({ currentUser }) {
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
  const [posko, setPosko] = useState({ name: '', lat: '', lng: '', address: '', contact: '', current_occupancy: 0, max_capacity: 100 });
  const [newZone, setNewZone] = useState({
    name: '',
    hazard_type: 'gempa',
    severity_level: 'level_3_critical',
    lat: '',
    lng: '',
    radius_km: '2.5',
    description: ''
  });

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const requests = [
        fetch('/api/map/emergency-reports', { cache: 'no-store' }).then(readJson),
        fetch('/api/map/markers', { cache: 'no-store' }).then(readJson),
        fetch('/api/map/disaster-zones', { cache: 'no-store' }).then(readJson).catch(() => ({ success: true, data: [] }))
      ];
      if (currentUser.canManageRoles) {
        requests.push(fetch('/api/auth/users', { cache: 'no-store' }).then(readJson));
      }
      const [reportResult, markerResult, zoneResult, accountResult] = await Promise.all(requests);
      setReports(reportResult.data);
      setPoskos(markerResult.data.posko);
      if (zoneResult?.data) setZones(zoneResult.data);
      if (accountResult) setAccounts(accountResult.data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser.canManageRoles]);

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
        lat: '',
        lng: '',
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
      setPosko({ name: '', lat: '', lng: '', address: '', contact: '' });
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

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-2xl bg-[#0D47A1] p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Panel Tim SAR · {currentUser.name}</p>
        <h1 className="mt-1 text-2xl font-extrabold">Laporan bantuan & posko</h1>
        <p className="mt-2 text-xs leading-relaxed text-blue-100">Sebagian laporan awal adalah data demo, bukan permintaan bantuan nyata. Panel ini tidak terhubung ke dispatch resmi; jangan gunakan data atau nomor contoh untuk mengirim bantuan. Verifikasi setiap laporan secara mandiri.</p>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900 text-lg">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Triase & Respons Laporan Korban
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Filter prioritas penyelamatan dan tugaskan regu lapangan.</p>
          </div>
          <button type="button" onClick={loadData} className="min-h-10 px-3 rounded-xl border border-slate-200 flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50" aria-label="Muat ulang panel">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Triage Priority Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
          {[
            { id: 'all', label: `Semua (${reports.length})` },
            { id: 'trapped', label: `🚨 Terjebak Auto-PASS (${reports.filter(r => r.needs_description?.includes('[AUTO-TRIGGER PASS]')).length})` },
            { id: 'critical', label: `🔴 Kritis/Rentan (${reports.filter(r => r.urgency_level === 'KRITIS' || r.vulnerable_members?.includes('Bayi') || r.vulnerable_members?.includes('Lansia')).length})` },
            { id: 'in_progress', label: `🚑 Menuju Lokasi (${reports.filter(r => r.status === 'in_progress').length})` },
            { id: 'resolved', label: `✅ Berhasil Dievakuasi (${reports.filter(r => r.status === 'resolved').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTriageFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                triageFilter === tab.id
                  ? 'bg-[#0D47A1] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <p role="status" className="text-sm text-slate-600">Memuat laporan dan posko…</p>}
        {!loading && !reports.length && <p className="text-sm text-slate-500">Belum ada laporan.</p>}
        {reports
          .filter(report => {
            if (triageFilter === 'trapped') return report.needs_description?.includes('[AUTO-TRIGGER PASS]');
            if (triageFilter === 'critical') return report.urgency_level === 'KRITIS' || report.vulnerable_members?.includes('Bayi') || report.vulnerable_members?.includes('Lansia');
            if (triageFilter === 'in_progress') return report.status === 'in_progress';
            if (triageFilter === 'resolved') return report.status === 'resolved';
            return true;
          })
          .map(report => (
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
                        🚑 BANTUAN MENUJU LOKASI (OTW)
                      </span>
                    )}
                    {report.status === 'resolved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px]">
                        ✅ DIEVAKUASI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{report.hazard_type} · {report.reported_at || 'Baru saja'}</p>
                </div>
                <p className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <MapPin className="h-3.5 w-3.5 text-rose-600" />
                  {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                </p>
              </div>

              <p className="text-sm text-slate-800 leading-relaxed font-medium">{report.needs_description}</p>
              <p className="text-xs text-slate-600">Kebutuhan rentan: <strong>{report.vulnerable_members}</strong> · Kontak: {report.contact}</p>

              {/* Status Dispatch Bar jika sedang in_progress */}
              {report.status === 'in_progress' && (
                <div className="rounded-xl border border-blue-200 bg-blue-100/60 p-3 text-xs text-blue-950 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                    <span>Regu Ditugaskan: <strong>{report.dispatch_team || 'Tim SAR Lapangan'}</strong></span>
                  </div>
                  <span>Estimasi Tiba (ETA): <strong>{report.eta_minutes || 15} Menit</strong></span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {report.status !== 'in_progress' && report.status !== 'resolved' && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      setDispatchModalReport(report);
                      setDispatchTeam('Regu SAR Alpha 01');
                      setDispatchEta('15');
                    }}
                    className="min-h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>🚑 Tugaskan Regu Penolong (OTW)</span>
                  </button>
                )}
                {report.status === 'in_progress' && (
                  <button
                    disabled={busy}
                    onClick={() => updateReport(report.id, 'resolved')}
                    className="min-h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tandai Berhasil Dievakuasi</span>
                  </button>
                )}
                {report.status === 'resolved' && (
                  <button
                    disabled={busy}
                    onClick={() => updateReport(report.id, 'waiting_rescue')}
                    className="min-h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Buka Kembali Laporan
                  </button>
                )}
              </div>
            </article>
          ))}

        {/* Modal Konfirmasi Dispatch Regu Penyelamat */}
        {dispatchModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">Tugaskan Regu SAR Lapangan</h3>
                <button type="button" onClick={() => setDispatchModalReport(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Menugaskan regu akan seketika menyiarkan status <strong>BANTUAN MENUJU LOKASI</strong> ke layar ponsel korban untuk memberikan kepastian dan ketenangan.
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
      </section>

      {/* Zona Bencana & Level Bahaya Management (SAR Special Feature) */}
      <section className="space-y-4 rounded-2xl border-2 border-rose-300 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-600 text-white rounded">
                KOMANDO SAR
              </span>
              <h2 className="text-lg font-black text-slate-900">Penetapan Zona Bencana & Level Bahaya</h2>
            </div>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Tetapkan area terdampak bencana dan tingkat keparahannya. Di <strong>Level 3 (AWAS - Kritis)</strong>, sistem deteksi korban terjebak (PASS Dead-Man Switch) otomatis memantau warga yang tidak berpindah posisi.
            </p>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
            {zones.length} Zona Terdata
          </span>
        </div>

        {/* Form Tambah Zona Bencana */}
        <form onSubmit={handleAddZone} className="grid gap-3 sm:grid-cols-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <label className="text-xs font-bold text-slate-700">Nama Zona Bencana
            <input required maxLength={120} placeholder="Contoh: Zona Merah Sesar Lembang RW 04" value={newZone.name} onChange={e => setNewZone({ ...newZone, name: e.target.value })} className="form-control mt-1" />
          </label>

          <label className="text-xs font-bold text-slate-700">Jenis Bencana
            <select value={newZone.hazard_type} onChange={e => setNewZone({ ...newZone, hazard_type: e.target.value })} className="form-control mt-1 bg-white">
              <option value="gempa">Gempa Bumi (Struktur Roboh)</option>
              <option value="banjir">Banjir Bandang / Luapan</option>
              <option value="longsor">Tanah Longsor</option>
              <option value="erupsi">Erupsi Gunung Berapi</option>
              <option value="kebakaran">Kebakaran Hutan / Pemukiman</option>
            </select>
          </label>

          <label className="text-xs font-bold text-slate-700">Level Bahaya
            <select value={newZone.severity_level} onChange={e => setNewZone({ ...newZone, severity_level: e.target.value })} className="form-control mt-1 bg-white font-bold">
              <option value="level_3_critical" className="text-rose-700 font-bold">Level 3: AWAS (Tingkat Kritis - Auto PASS Terjebak Aktif)</option>
              <option value="level_2_warning" className="text-amber-700 font-bold">Level 2: SIAGA (Tingkat Sedang)</option>
              <option value="level_1_advisory" className="text-blue-700 font-bold">Level 1: WASPADA (Tingkat Rendah / Pantauan)</option>
            </select>
          </label>

          <label className="text-xs font-bold text-slate-700">Radius Dampak (KM)
            <input required type="number" step="0.1" min="0.2" max="50" placeholder="2.5" value={newZone.radius_km} onChange={e => setNewZone({ ...newZone, radius_km: e.target.value })} className="form-control mt-1" />
          </label>

          <label className="text-xs font-bold text-slate-700">Latitude Titik Pusat
            <input required type="number" step="any" min="-90" max="90" placeholder="-6.8880" value={newZone.lat} onChange={e => setNewZone({ ...newZone, lat: e.target.value })} className="form-control mt-1" />
          </label>

          <label className="text-xs font-bold text-slate-700">Longitude Titik Pusat
            <input required type="number" step="any" min="-180" max="180" placeholder="107.5940" value={newZone.lng} onChange={e => setNewZone({ ...newZone, lng: e.target.value })} className="form-control mt-1" />
          </label>

          <label className="text-xs font-bold text-slate-700 sm:col-span-2">Deskripsi Dampak & Arahan Lapangan
            <input maxLength={250} placeholder="Contoh: Reruntuhan padat, dicurigai banyak korban tertimbun di dalam bangunan." value={newZone.description} onChange={e => setNewZone({ ...newZone, description: e.target.value })} className="form-control mt-1" />
          </label>

          <button disabled={busy} className="min-h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md transition-all sm:col-span-2 cursor-pointer disabled:opacity-50">
            Tetapkan & Aktifkan Zona Bencana
          </button>
        </form>

        {/* Daftar Zona Bencana Aktif */}
        <div className="space-y-3 pt-2">
          <h3 className="font-extrabold text-sm text-slate-800">Daftar Zona Bencana Aktif</h3>
          {zones.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Belum ada zona bencana yang ditetapkan oleh Tim SAR.</p>
          ) : (
            zones.map(z => {
              const isLevel3 = z.severity_level === 'level_3_critical';
              const isLevel2 = z.severity_level === 'level_2_warning';
              return (
                <div key={z.id} className={`p-4 rounded-2xl border transition-all ${
                  isLevel3
                    ? 'bg-rose-50/80 border-rose-300'
                    : isLevel2
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-blue-50/60 border-blue-200'
                }`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded text-white ${
                          isLevel3 ? 'bg-rose-600' : isLevel2 ? 'bg-amber-600' : 'bg-blue-600'
                        }`}>
                          {z.severity_label || z.severity_level}
                        </span>
                        <h4 className="font-black text-slate-900 text-base">{z.name}</h4>
                        <span className="text-xs text-slate-500 uppercase font-semibold">({z.hazard_type})</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{z.description}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Titik Pusat: {z.lat}, {z.lng} · Radius: <strong>{z.radius_km} km</strong> · Ditetapkan oleh: {z.declared_by}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeleteZone(z.id)}
                      className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Selesaikan Zona</span>
                    </button>
                  </div>

                  {isLevel3 && (
                    <div className="mt-3 p-2.5 bg-rose-100/90 rounded-xl border border-rose-300 text-rose-950 text-xs flex items-center gap-2 font-bold">
                      <Radio className="w-4 h-4 text-rose-700 shrink-0 animate-pulse" />
                      <span>Sistem PASS Aktif: Ponsel warga yang tidak bergerak &gt; 1 jam di zona ini akan otomatis mengirim SOS dan membunyikan peluit.</span>
                    </div>
                  )}

                  {/* Quick Change Severity */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-semibold text-slate-600">Ubah Level:</span>
                    <button
                      type="button"
                      disabled={busy || z.severity_level === 'level_3_critical'}
                      onClick={() => handleUpdateZoneSeverity(z.id, 'level_3_critical')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        z.severity_level === 'level_3_critical'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-rose-50'
                      }`}
                    >
                      Level 3 (AWAS)
                    </button>
                    <button
                      type="button"
                      disabled={busy || z.severity_level === 'level_2_warning'}
                      onClick={() => handleUpdateZoneSeverity(z.id, 'level_2_warning')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        z.severity_level === 'level_2_warning'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      Level 2 (SIAGA)
                    </button>
                    <button
                      type="button"
                      disabled={busy || z.severity_level === 'level_1_advisory'}
                      onClick={() => handleUpdateZoneSeverity(z.id, 'level_1_advisory')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        z.severity_level === 'level_1_advisory'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50'
                      }`}
                    >
                      Level 1 (WASPADA)
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><MapPin className="h-5 w-5 text-blue-700" />Tambah posko</h2>
        <form onSubmit={addPosko} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Nama posko<input required maxLength={120} value={posko.name} onChange={event => setPosko({ ...posko, name: event.target.value })} className="form-control mt-1" /></label>
          <label className="text-xs font-semibold text-slate-700">Alamat / area<input required maxLength={200} value={posko.address} onChange={event => setPosko({ ...posko, address: event.target.value })} className="form-control mt-1" /></label>
          <label className="text-xs font-semibold text-slate-700">Latitude<input required type="number" step="any" min="-90" max="90" value={posko.lat} onChange={event => setPosko({ ...posko, lat: event.target.value })} className="form-control mt-1" /></label>
          <label className="text-xs font-semibold text-slate-700">Longitude<input required type="number" step="any" min="-180" max="180" value={posko.lng} onChange={event => setPosko({ ...posko, lng: event.target.value })} className="form-control mt-1" /></label>
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Kontak posko (opsional)<input maxLength={100} value={posko.contact} onChange={event => setPosko({ ...posko, contact: event.target.value })} className="form-control mt-1" /></label>
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 sm:col-span-2">Status posko baru belum dikonfirmasi. Pastikan posko beroperasi sebelum menandainya buka dan dicek. Pengecekan Tim SAR bukan konfirmasi resmi dari instansi pemerintah.</p>
          <button disabled={busy} className="min-h-11 rounded-xl bg-[#0D47A1] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2">Simpan posko</button>
        </form>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div>
          <h2 className="font-bold text-slate-900">Kelola posko</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">Posko hanya muncul sebagai tujuan rute jika berstatus buka dan sudah dicek Tim SAR. Mengubah detail atau membuka kembali posko akan meminta pengecekan ulang.</p>
        </div>
        {loading && <p role="status" className="text-sm text-slate-600">Memuat daftar posko…</p>}
        {!loading && !poskos.length && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Belum ada posko untuk dikelola.</p>}
        {poskos.map(item => {
          const routeEligible = isRouteEligiblePosko(item);
          const isEditing = editingPoskoId === item.id;
          const statusText = routeEligible
            ? 'Buka · dicek Tim SAR, tersedia sebagai tujuan rute'
            : item.operational_status === 'closed'
              ? 'Ditutup · tidak tersedia sebagai tujuan rute'
              : item.operational_status === 'open'
                ? 'Buka · menunggu pengecekan, belum tersedia sebagai tujuan rute'
                : 'Status belum dikonfirmasi · belum tersedia sebagai tujuan rute';

          return (
            <article key={item.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-bold text-slate-900">{item.name}</h3>
                  <p className={`mt-1 text-xs font-semibold ${routeEligible ? 'text-emerald-800' : 'text-amber-800'}`}>{statusText}</p>
                  <p className="mt-1 break-words text-xs text-slate-600">{item.address}</p>
                  <p className="mt-1 text-xs text-slate-600">Kontak: {item.contact || 'Belum diinformasikan'}</p>
                  {item.last_checked_at && (
                    <p className="mt-1 text-xs text-slate-500">
                      Dicek {new Date(item.last_checked_at).toLocaleString('id-ID')}{item.last_checked_by ? ` oleh ${item.last_checked_by}` : ''}
                    </p>
                  )}
                  {item.source_type !== 'sar_contribution' && (
                    <p className="mt-1 text-xs text-slate-500">Data posko awal aplikasi; lakukan pengecekan sebelum mengandalkannya.</p>
                  )}
                </div>
                <p className="shrink-0 text-xs text-slate-600">{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</p>
              </div>

              {/* Status Kapasitas Posko & Quick Stepper SAR */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Kapasitas Pengungsi:</span>
                  <span className="font-extrabold text-slate-900">
                    {item.current_occupancy || 0} / {item.max_capacity || 100} Jiwa
                    <span className="ml-1 text-[11px] text-slate-500 font-semibold">
                      ({Math.round(((item.current_occupancy || 0) / (item.max_capacity || 100)) * 100)}% Terisi)
                    </span>
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
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
                  <span className="text-[11px] text-slate-500">Update Cepat Jumlah Jiwa:</span>
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

              {isEditing && poskoDraft ? (
                <form onSubmit={savePoskoDraft} className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-700">Nama posko
                    <input required minLength={2} maxLength={120} value={poskoDraft.name} onChange={event => setPoskoDraft({ ...poskoDraft, name: event.target.value })} className="form-control mt-1" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Alamat / area
                    <input required minLength={2} maxLength={200} value={poskoDraft.address} onChange={event => setPoskoDraft({ ...poskoDraft, address: event.target.value })} className="form-control mt-1" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Pengungsi Saat Ini (Jiwa)
                    <input required type="number" min="0" value={poskoDraft.current_occupancy} onChange={event => setPoskoDraft({ ...poskoDraft, current_occupancy: event.target.value })} className="form-control mt-1" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Kapasitas Maksimal (Jiwa)
                    <input required type="number" min="1" value={poskoDraft.max_capacity} onChange={event => setPoskoDraft({ ...poskoDraft, max_capacity: event.target.value })} className="form-control mt-1" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Latitude
                    <input required type="number" step="any" min="-90" max="90" value={poskoDraft.lat} onChange={event => setPoskoDraft({ ...poskoDraft, lat: event.target.value })} className="form-control mt-1" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Longitude
                    <input required type="number" step="any" min="-180" max="180" value={poskoDraft.lng} onChange={event => setPoskoDraft({ ...poskoDraft, lng: event.target.value })} className="form-control mt-1" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Kontak posko
                    <input maxLength={100} value={poskoDraft.contact} onChange={event => setPoskoDraft({ ...poskoDraft, contact: event.target.value })} className="form-control mt-1" />
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button disabled={busy} className="min-h-11 rounded-lg bg-[#0D47A1] px-4 py-2 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">Simpan perubahan</button>
                    <button type="button" disabled={busy} onClick={() => { setEditingPoskoId(null); setPoskoDraft(null); }} className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Batal</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button type="button" disabled={busy} onClick={() => startEditingPosko(item)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                    <Pencil className="h-4 w-4" aria-hidden="true" />Ubah detail
                  </button>
                  <button type="button" disabled={busy} onClick={() => updatePosko(item.id, {
                    operational_status: item.operational_status === 'open' ? 'closed' : 'open'
                  }, item.operational_status === 'open'
                    ? 'Posko ditutup dan tidak lagi ditawarkan sebagai tujuan rute.'
                    : 'Posko dibuka dan perlu dicek sebelum tersedia sebagai tujuan rute.')} className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                    {item.operational_status === 'open' ? 'Tutup posko' : 'Tandai posko dibuka'}
                  </button>
                  <button type="button" disabled={busy || item.operational_status !== 'open'} onClick={() => updatePosko(item.id, {
                    verification_status: item.verification_status === 'sar_checked' ? 'pending' : 'sar_checked'
                  }, item.verification_status === 'sar_checked'
                    ? 'Pengecekan posko dibatalkan. Posko tidak ditawarkan sebagai tujuan rute.'
                    : 'Pengecekan Tim SAR dicatat. Ini bukan verifikasi resmi instansi.')} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${
                    item.verification_status === 'sar_checked'
                      ? 'border border-amber-300 text-amber-900 hover:bg-amber-50'
                      : 'bg-emerald-800 text-white hover:bg-emerald-900'
                  } disabled:cursor-not-allowed`}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {item.operational_status !== 'open'
                      ? 'Tandai buka dulu'
                      : item.verification_status === 'sar_checked'
                        ? 'Minta cek ulang'
                        : 'Tandai sudah dicek'}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {currentUser.canManageRoles && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><Users className="h-5 w-5 text-blue-700" />Kelola akses Tim SAR</h2>
          <p className="mb-3 text-xs text-slate-600">Hanya admin awal yang dikonfigurasi di server dapat menetapkan role SAR.</p>
          <div className="space-y-2">
            {accounts.map(account => (
              <div key={account.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3">
                <div><p className="text-sm font-bold text-slate-800">{account.name}</p><p className="text-xs text-slate-500">{account.email}</p></div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><ShieldCheck className="h-4 w-4" /><select disabled={account.canManageRoles} value={account.role} onChange={event => updateRole(account.id, event.target.value)} className="rounded-lg border border-slate-200 bg-white p-2"><option value="user">Pengguna</option><option value="sar">Tim SAR</option></select></label>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
