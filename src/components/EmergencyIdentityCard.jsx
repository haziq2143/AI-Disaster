'use client';

import React, { useState } from 'react';
import { ArrowLeft, Copy, QrCode, ShieldAlert, Trash2 } from 'lucide-react';
import { emergencyCardText } from '../lib/emergencyCard.js';

export default function EmergencyIdentityCard({ card, onBack, onClear }) {
  const [qrImage, setQrImage] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const isValidCard = card
    && card.version === 1
    && typeof card.name === 'string'
    && card.name.trim().length > 0
    && card.name.length <= 80
    && card.profile
    && typeof card.profile === 'object'
    && !Array.isArray(card.profile)
    && Object.values(card.profile).every(value => typeof value === 'string' && value.length <= 1000)
    && typeof card.savedAt === 'string'
    && Number.isFinite(Date.parse(card.savedAt))
    && typeof card.qrImage === 'string'
    && card.qrImage.length <= 100_000
    && /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(card.qrImage)
    && (!card.profile.profilePhoto
      || (card.profile.profilePhoto.length <= 350_000
        && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(card.profile.profilePhoto)));
  const text = isValidCard ? emergencyCardText(card) : '';

  const toggleQr = () => {
    setError('');
    setNotice('');
    if (qrImage) {
      setQrImage('');
      return;
    }
    if (!card.qrImage) {
      setError('QR belum disiapkan. Perbarui salinan kartu saat perangkat terhubung ke internet.');
      return;
    }
    setQrImage(card.qrImage);
  };

  const copyCard = async () => {
    setError('');
    setNotice('');
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Informasi kartu disalin. Bagikan hanya kepada orang yang kamu percaya.');
    } catch (copyError) {
      console.error('Gagal menyalin kartu identitas darurat:', copyError);
      setError('Kartu tidak dapat disalin. Kamu tetap dapat menunjukkannya dari layar.');
    }
  };

  if (!isValidCard) {
    return (
      <main className="min-h-dvh bg-slate-50 p-5">
        <section className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm">
          <button type="button" onClick={onBack} className="secondary-action"><ArrowLeft className="h-4 w-4" />Kembali</button>
          <h1 className="mt-5 text-2xl font-black text-slate-900">Kartu offline tidak tersedia</h1>
          <p className="mt-2 text-sm text-slate-600">Buka Pengaturan saat online, lalu simpan kartu identitas darurat untuk perangkat ini.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-blue-50 via-slate-50 to-sky-100 px-4 py-8">
      <section className="mx-auto max-w-xl space-y-4">
        <button type="button" onClick={onBack} className="secondary-action"><ArrowLeft className="h-4 w-4" />Kembali</button>

        <article className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
          <header className="flex items-center gap-3 bg-[#0D47A1] p-5 text-white">
            <ShieldAlert className="h-7 w-7 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Informasi penting</p>
              <h1 className="text-xl font-black">Kartu Identitas Darurat</h1>
            </div>
          </header>

          <div className="space-y-5 p-5 sm:p-7">
            <div className="flex items-center gap-4">
              {card.profile.profilePhoto
                ? <img src={card.profile.profilePhoto} alt={`Foto ${card.name}`} className="h-20 w-20 rounded-2xl border border-slate-200 object-cover" />
                : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-800">{card.name.trim().charAt(0).toUpperCase()}</div>}
              <div>
                <p className="text-xs font-semibold text-slate-500">Nama</p>
                <p className="text-xl font-black text-slate-900">{card.name}</p>
                {card.profile.dateOfBirth && <p className="mt-1 text-sm text-slate-600">Tanggal lahir: {card.profile.dateOfBirth}</p>}
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ['Telepon', card.profile.phone],
                ['Golongan darah', card.profile.bloodType],
                ['Jenis kelamin', card.profile.gender],
                ['Domisili', card.profile.homeArea],
                ['Kontak darurat', card.profile.emergencyContactName],
                ['Telepon kontak darurat', card.profile.emergencyContactPhone]
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-bold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>

            {card.profile.medicalInfo && (
              <section className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                <h2 className="text-sm font-extrabold text-rose-900">Riwayat kesehatan / alergi</h2>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-rose-950">{card.profile.medicalInfo}</p>
              </section>
            )}

            <p className="text-xs text-slate-500">
              Salinan perangkat dibuat {new Date(card.savedAt).toLocaleString('id-ID')}. Data ini mungkin tidak sama dengan profil terbaru.
            </p>
          </div>
        </article>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          Kartu ini tersimpan di perangkat dan bisa dilihat siapa pun yang membuka perangkat ini. QR berisi informasi kartu dan tidak bisa ditarik kembali setelah dipindai atau disalin. Bagikan hanya jika diperlukan dan dengan persetujuanmu.
        </section>

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={toggleQr} className="primary-action">
            <QrCode className="h-4 w-4" />
            {qrImage ? 'Sembunyikan QR' : 'Tampilkan QR untuk dibagikan'}
          </button>
          <button type="button" onClick={copyCard} className="secondary-action">
            <Copy className="h-4 w-4" />Salin teks
          </button>
          {onClear && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Hapus salinan kartu darurat dari perangkat ini?')) onClear();
              }}
              className="danger-action"
            >
              <Trash2 className="h-4 w-4" />Hapus salinan offline
            </button>
          )}
        </div>

        {qrImage && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <img src={qrImage} alt="QR berisi informasi kartu identitas darurat" className="mx-auto h-64 w-64 max-w-full" />
            <p className="mt-3 text-xs leading-relaxed text-slate-600">Siapa pun yang memindai QR ini dapat membaca data yang terlihat pada kartu.</p>
          </section>
        )}
      </section>
    </main>
  );
}
