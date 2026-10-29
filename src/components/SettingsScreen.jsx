'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Camera, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react';

const EMPTY_PROFILE = {
  profilePhoto: '',
  dateOfBirth: '',
  phone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  bloodType: '',
  gender: '',
  medicalInfo: '',
  homeArea: ''
};

async function prepareProfilePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Gunakan foto JPG, PNG, atau WebP.');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran foto maksimal 5 MB.');

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const loadedImage = new Image();
      loadedImage.onload = () => resolve(loadedImage);
      loadedImage.onerror = () => reject(new Error('Foto tidak dapat dibuka.'));
      loadedImage.src = imageUrl;
    });
    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser tidak dapat memproses foto.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    if (dataUrl.length > 350_000) dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    if (dataUrl.length > 350_000) throw new Error('Foto masih terlalu besar setelah diperkecil.');
    return dataUrl;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function ProfileField({ label, children, className = '' }) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label}
      {children}
    </label>
  );
}

export default function SettingsScreen({ currentUser, onSignOut, onBack, onProfileUpdated }) {
  const isGuest = currentUser.isGuest === true;
  const [name, setName] = useState(currentUser.name || '');
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(!isGuest);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (isGuest) return undefined;
    let active = true;
    fetch('/api/auth/profile', { cache: 'no-store', credentials: 'same-origin' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Profil tidak dapat dimuat.');
        if (active) {
          setName(result.data.user.name);
          setProfile({ ...EMPTY_PROFILE, ...result.data.profile });
        }
      })
      .catch(loadError => {
        if (active) setError(loadError.message || 'Profil tidak dapat dimuat. Coba lagi.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [isGuest]);

  const updateProfileField = (field, value) => {
    setProfile(current => ({ ...current, [field]: value }));
  };

  const handlePhotoChange = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setNotice('');
    try {
      updateProfileField('profilePhoto', await prepareProfilePhoto(file));
    } catch (photoError) {
      setError(photoError.message || 'Foto profil tidak dapat diproses.');
    }
  };

  const handleSave = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, profile })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Profil tidak dapat disimpan.');
      setName(result.data.user.name);
      setProfile({ ...EMPTY_PROFILE, ...result.data.profile });
      onProfileUpdated(result.data.user);
      setNotice('Profil berhasil disimpan dan hanya dapat dilihat setelah masuk ke akun ini.');
    } catch (saveError) {
      setError(saveError.message || 'Profil tidak dapat disimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="animate-fadeIn space-y-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali ke beranda"
          className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">Akun dan aplikasi</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Pengaturan</h1>
          <p className="mt-1 text-sm text-slate-600">Perbarui profil identitas dan informasi pentingmu.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm" aria-labelledby="settings-profile-title">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 id="settings-profile-title" className="font-extrabold text-slate-900">Profil identitas</h2>
            <p className="text-xs text-slate-500">{currentUser.email || 'Mode tamu'}</p>
          </div>
        </div>

        {isGuest ? (
          <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Profil tersimpan di akun dan tidak tersedia dalam mode tamu. Masuk atau buat akun untuk menyimpan informasi agar dapat dimuat kembali setelah masuk di perangkat lain.
          </p>
        ) : loading ? (
          <p className="mt-5 text-sm text-slate-600">Memuat profil…</p>
        ) : (
          <form onSubmit={handleSave} className="mt-5 space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                {profile.profilePhoto
                  ? <img src={profile.profilePhoto} alt="Foto profil" className="h-full w-full object-cover" />
                  : <UserRound className="h-10 w-10" />}
              </div>
              <div className="space-y-2">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <Camera className="h-4 w-4" />
                  Pilih foto
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="sr-only" />
                </label>
                {profile.profilePhoto && (
                  <button
                    type="button"
                    onClick={() => updateProfileField('profilePhoto', '')}
                    className="ml-2 min-h-10 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Hapus foto
                  </button>
                )}
                <p className="text-xs text-slate-500">JPG, PNG, atau WebP · maksimal 5 MB sebelum diperkecil.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField label="Nama lengkap">
                <input required minLength={2} maxLength={80} value={name} onChange={event => setName(event.target.value)} className="form-control mt-1.5" autoComplete="name" />
              </ProfileField>
              <ProfileField label="Tanggal lahir">
                <input type="date" max={new Date().toISOString().slice(0, 10)} value={profile.dateOfBirth} onChange={event => updateProfileField('dateOfBirth', event.target.value)} className="form-control mt-1.5" autoComplete="bday" />
              </ProfileField>
              <ProfileField label="Nomor telepon">
                <input type="tel" maxLength={32} value={profile.phone} onChange={event => updateProfileField('phone', event.target.value)} className="form-control mt-1.5" autoComplete="tel" placeholder="Contoh: +62 812 3456 7890" />
              </ProfileField>
              <ProfileField label="Jenis kelamin">
                <select value={profile.gender} onChange={event => updateProfileField('gender', event.target.value)} className="form-control mt-1.5">
                  <option value="">Pilih jika ingin</option>
                  <option value="Perempuan">Perempuan</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Lainnya">Lainnya</option>
                  <option value="Tidak ingin menyebutkan">Tidak ingin menyebutkan</option>
                </select>
              </ProfileField>
              <ProfileField label="Golongan darah">
                <select value={profile.bloodType} onChange={event => updateProfileField('bloodType', event.target.value)} className="form-control mt-1.5">
                  <option value="">Pilih jika tahu</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak tahu'].map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </ProfileField>
              <ProfileField label="Domisili (kota/kecamatan)">
                <input maxLength={160} value={profile.homeArea} onChange={event => updateProfileField('homeArea', event.target.value)} className="form-control mt-1.5" autoComplete="address-level2" placeholder="Hindari alamat rumah yang terlalu rinci" />
              </ProfileField>
              <ProfileField label="Kontak darurat — nama">
                <input maxLength={80} value={profile.emergencyContactName} onChange={event => updateProfileField('emergencyContactName', event.target.value)} className="form-control mt-1.5" autoComplete="off" />
              </ProfileField>
              <ProfileField label="Kontak darurat — nomor telepon">
                <input type="tel" maxLength={32} value={profile.emergencyContactPhone} onChange={event => updateProfileField('emergencyContactPhone', event.target.value)} className="form-control mt-1.5" autoComplete="off" />
              </ProfileField>
            </div>

            <ProfileField label="Riwayat kesehatan dan alergi penting">
              <textarea
                maxLength={1000}
                rows={4}
                value={profile.medicalInfo}
                onChange={event => updateProfileField('medicalInfo', event.target.value)}
                className="form-control mt-1.5 resize-y"
                placeholder="Opsional. Contoh: kondisi kesehatan, alergi obat/makanan, atau kebutuhan bantuan khusus."
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">Opsional · maksimal 1.000 karakter.</span>
            </ProfileField>

            <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              Info ini bersifat pribadi dan hanya ditampilkan setelah masuk ke akunmu. Petugas atau orang lain tidak bisa melihatnya dari peta; jangan jadikan aplikasi ini satu-satunya sumber identitas saat darurat.
            </p>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
            {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
            <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D47A1] px-4 py-2 text-sm font-bold text-white hover:bg-[#1565C0] disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? 'Menyimpan…' : 'Simpan profil'}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm" aria-labelledby="settings-data-title">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 id="settings-data-title" className="font-extrabold text-slate-900">Penyimpanan data</h2>
            <p className="text-xs text-slate-500">Informasi untuk prototype ini</p>
          </div>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
          <li>Profil akun tersimpan di server dan dapat dimuat kembali setelah masuk ke akun.</li>
          <li>Checklist dan rencana lokal tersimpan di browser perangkat ini.</li>
          <li>{isGuest ? 'Mode tamu tidak menyinkronkan data keluarga ke akun.' : 'Data keluarga hanya disinkronkan ke server jika grup keluarga dibuat atau diikuti.'}</li>
          <li>Data peta, rute, dan panduan pada prototype bukan informasi darurat real-time.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-extrabold text-slate-900">Sesi</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {isGuest ? 'Keluar dari mode tamu akan kembali ke halaman masuk.' : 'Keluar akan mengakhiri sesi akun pada perangkat ini.'}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100"
        >
          <LogOut className="h-4 w-4" />
          {isGuest ? 'Keluar dari mode tamu' : 'Keluar dari akun'}
        </button>
      </section>
    </section>
  );
}
