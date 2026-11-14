import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  X, 
  Phone, 
  Share2, 
  MapPin, 
  AlertTriangle,
  Battery
} from 'lucide-react';

export default function FallbackSosModal({ 
  isOpen, 
  onClose, 
  hazardType = 'bencana', 
  userLocation, 
  userName = 'Warga' 
}) {
  const [targetPhone, setTargetPhone] = useState('');
  const [userCondition, setUserCondition] = useState('Terjebak & butuh evakuasi segera');
  const [copied, setCopied] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);

  useEffect(() => {
    // Coba baca level baterai jika didukung browser
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
      }).catch(() => {});
    }

    // Coba baca kontak darurat dari profile di localStorage jika ada
    try {
      const storedProfile = localStorage.getItem('disaster_emergency_card_v1');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.emergency_contact_phone) {
          setTargetPhone(parsed.emergency_contact_phone);
        }
      }
    } catch {}
  }, []);

  if (!isOpen) return null;

  const lat = userLocation?.lat ? userLocation.lat.toFixed(5) : null;
  const lng = userLocation?.lng ? userLocation.lng.toFixed(5) : null;
  const mapsUrl = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : 'Koordinat GPS belum terkunci';

  const timeString = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  // Susun template pesan darurat ringkas & padat
  const sosMessage = `[SOS DARURAT] Butuh Bantuan Segera!
Nama: ${userName || 'Warga'}
Situasi: ${hazardType.toUpperCase()}
Kondisi: ${userCondition}
Lokasi: ${mapsUrl}
${lat && lng ? `Koordinat: ${lat}, ${lng}` : ''}
${batteryLevel !== null ? `Sisa Baterai HP: ${batteryLevel}%` : ''}
Waktu: ${dateString} ${timeString}
(Dikirim via Guardian Shield Fallback)`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sosMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback manual
      const textarea = document.createElement('textarea');
      textarea.value = sosMessage;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendSms = () => {
    const cleanPhone = targetPhone.replace(/[^0-9+]/g, '');
    const smsUrl = cleanPhone 
      ? `sms:${cleanPhone}?body=${encodeURIComponent(sosMessage)}`
      : `sms:?body=${encodeURIComponent(sosMessage)}`;
    window.location.href = smsUrl;
  };

  const handleSendWa = () => {
    let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(sosMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(sosMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700">
                Fallback Sinyal Lemah / 2G
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Kirim SOS via SMS & WhatsApp
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info callout */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Jika internet data (4G/5G) lambat atau gagal kirim ke server, kirim pesan SMS/WhatsApp langsung dari kartu SIM ponsel Anda ke nomor keluarga atau tim penyelamat.
          </p>
        </div>

        {/* Input Target Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Nomor Kontak Darurat / Keluarga (Opsional):</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input 
              type="tel"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              placeholder="Contoh: 08123456789 atau 115 (Basarnas)"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
            />
          </div>
        </div>

        {/* Quick condition selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Kondisi Anda Saat Ini:</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Terjebak & butuh evakuasi segera',
              'Ada korban luka / butuh medis',
              'Terisolasi air / jalan terputus',
              'Selamat, tetapi butuh logistik'
            ].map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => setUserCondition(cond)}
                className={`p-2 rounded-xl text-[11px] font-semibold text-left border transition-all cursor-pointer ${
                  userCondition === cond
                    ? 'bg-[#E3F2FD] border-[#2196F3] text-[#0D47A1]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Teks Pesan Siap Kirim:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[#0D47A1] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
          </div>
          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 select-all">
            {sosMessage}
          </div>
        </div>

        {/* Dispatch Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleSendSms}
            className="py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Kirim via SMS</span>
          </button>

          <button
            type="button"
            onClick={handleSendWa}
            className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Buka WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
