'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, MapPin, RefreshCw, ShieldCheck, Users } from 'lucide-react';

async function readJson(response) {
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Permintaan gagal.');
  return result;
}

export default function SarDashboard({ currentUser }) {
  const [reports, setReports] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [posko, setPosko] = useState({ name: '', lat: '', lng: '', address: '', contact: '' });

  const loadData = useCallback(async () => {
    setError('');
    try {
      const requests = [fetch('/api/map/emergency-reports', { cache: 'no-store' }).then(readJson)];
      if (currentUser.canManageRoles) {
        requests.push(fetch('/api/auth/users', { cache: 'no-store' }).then(readJson));
      }
      const [reportResult, accountResult] = await Promise.all(requests);
      setReports(reportResult.data);
      if (accountResult) setAccounts(accountResult.data);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [currentUser.canManageRoles]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateReport = async (reportId, status) => {
    setBusy(true);
    setError('');
    try {
      await readJson(await fetch(`/api/map/emergency-reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }));
      setNotice('Status laporan diperbarui.');
      await loadData();
    } catch (updateError) {
      setError(updateError.message);
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
      setNotice('Posko ditambahkan sebagai data kontribusi Tim SAR; statusnya belum diverifikasi pihak berwenang.');
    } catch (addError) {
      setError(addError.message);
    } finally {
      setBusy(false);
    }
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
        <p className="mt-2 text-xs leading-relaxed text-blue-100">Data operasional yang ditampilkan belum terhubung ke instansi dispatch resmi. Verifikasi lapangan tetap diperlukan.</p>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold text-slate-900"><AlertTriangle className="h-5 w-5 text-rose-600" />Laporan yang membutuhkan respons</h2>
          <button type="button" onClick={loadData} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Muat ulang laporan"><RefreshCw className="h-4 w-4" /></button>
        </div>
        {!reports.length && <p className="text-sm text-slate-500">Belum ada laporan.</p>}
        {reports.map(report => (
          <article key={report.id} className="space-y-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900">{report.reporter_name} · {report.urgency_level}</h3>
                <p className="text-xs text-slate-600">{report.hazard_type} · {report.status} · {report.reported_at}</p>
              </div>
              <p className="flex items-center gap-1 text-xs font-semibold text-slate-700"><MapPin className="h-3.5 w-3.5" />{report.lat.toFixed(4)}, {report.lng.toFixed(4)}</p>
            </div>
            <p className="text-sm text-slate-700">{report.needs_description}</p>
            <p className="text-xs text-slate-600">Kebutuhan rentan: {report.vulnerable_members} · Kontak: {report.contact}</p>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => updateReport(report.id, 'in_progress')} className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 disabled:opacity-50">Dalam penanganan</button>
              <button disabled={busy} onClick={() => updateReport(report.id, 'resolved')} className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900 disabled:opacity-50">Selesai ditangani</button>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><MapPin className="h-5 w-5 text-blue-700" />Tambah posko</h2>
        <form onSubmit={addPosko} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Nama posko<input required maxLength={120} value={posko.name} onChange={event => setPosko({ ...posko, name: event.target.value })} className="form-control mt-1" /></label>
          <label className="text-xs font-semibold text-slate-700">Alamat / area<input required maxLength={200} value={posko.address} onChange={event => setPosko({ ...posko, address: event.target.value })} className="form-control mt-1" /></label>
          <label className="text-xs font-semibold text-slate-700">Latitude<input required type="number" step="any" min="-90" max="90" value={posko.lat} onChange={event => setPosko({ ...posko, lat: event.target.value })} className="form-control mt-1" /></label>
          <label className="text-xs font-semibold text-slate-700">Longitude<input required type="number" step="any" min="-180" max="180" value={posko.lng} onChange={event => setPosko({ ...posko, lng: event.target.value })} className="form-control mt-1" /></label>
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Kontak posko (opsional)<input maxLength={100} value={posko.contact} onChange={event => setPosko({ ...posko, contact: event.target.value })} className="form-control mt-1" /></label>
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 sm:col-span-2">Posko ditampilkan sebagai kontribusi akun SAR. Penambahan ini tidak berarti verifikasi resmi.</p>
          <button disabled={busy} className="min-h-11 rounded-xl bg-[#0D47A1] px-4 py-2 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">Simpan posko</button>
        </form>
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
