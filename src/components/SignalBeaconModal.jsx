import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Flashlight, 
  AlertTriangle, 
  X, 
  Radio, 
  Square, 
  Zap, 
  BatteryCharging, 
  Smartphone,
  CheckCircle2
} from 'lucide-react';

export default function SignalBeaconModal({ isOpen, onClose }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isStrobeActive, setIsStrobeActive] = useState(true);
  const [strobeLightOn, setStrobeLightOn] = useState(false);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  const [isTorchActive, setIsTorchActive] = useState(false);
  const [isEcoMode, setIsEcoMode] = useState(false);
  const [isHapticSupported, setIsHapticSupported] = useState(false);
  const [currentMorseChar, setCurrentMorseChar] = useState(''); // 'dot' | 'dash' | 'pause'
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isBatteryLow, setIsBatteryLow] = useState(false);

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const torchTrackRef = useRef(null);
  const isPlayingAudioRef = useRef(false);
  const isTorchActiveRef = useRef(false);
  const isStrobeActiveRef = useRef(true);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    isTorchActiveRef.current = isTorchActive;
  }, [isTorchActive]);

  useEffect(() => {
    isPlayingAudioRef.current = isPlayingAudio;
  }, [isPlayingAudio]);

  useEffect(() => {
    isStrobeActiveRef.current = isStrobeActive;
  }, [isStrobeActive]);

  // Periksa dukungan Web API (Vibration, Torch, Battery, Wake Lock)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      setIsHapticSupported(true);
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
      const constraints = navigator.mediaDevices.getSupportedConstraints();
      if (constraints.torch) {
        setIsTorchAvailable(true);
      }
    }

    // Monitor status baterai perangkat
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const updateBattery = () => {
          const pct = Math.round(battery.level * 100);
          setBatteryLevel(pct);
          setIsBatteryLow(pct <= 20 && !battery.charging);
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }

    return () => {
      stopAllDistressSignals();
    };
  }, []);

  // Request Screen Wake Lock agar layar HP tidak sleep / mati saat SOS aktif
  const requestWakeLock = async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        // Fallback jika ditolak sistem operasi
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
    }
  };

  // Begitu modal dibuka, OTOMATIS nyalakan semua sinyal darurat (suara, senter, layar, getar)
  useEffect(() => {
    if (isOpen) {
      startAllDistressSignals();
    } else {
      stopAllDistressSignals();
    }
  }, [isOpen]);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq, durationMs) => {
    return new Promise((resolve) => {
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Frekuensi akustik tajam menembus puing (3.000 Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Enveloping suara lembut menghindari suara pecah/pop speaker
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (durationMs / 1000) - 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + (durationMs / 1000));

        osc.onended = () => {
          resolve();
        };
      } catch (err) {
        resolve();
      }
    });
  };

  const sleep = (ms) => new Promise(r => {
    timerRef.current = setTimeout(r, ms);
  });

  const setPhysicalTorch = async (on) => {
    if (torchTrackRef.current) {
      try {
        await torchTrackRef.current.applyConstraints({ advanced: [{ torch: Boolean(on) }] });
      } catch (err) {
        // Fallback jika ditolak browser
      }
    }
  };

  // Helper emisi pulsa optik dan audio sinkron standar Morse SOS
  const emitPulse = async (freq, durationMs, charType) => {
    if (!isPlayingAudioRef.current) return;
    setCurrentMorseChar(charType);
    if (isStrobeActiveRef.current) {
      setStrobeLightOn(true);
    }
    if (isTorchActiveRef.current) {
      setPhysicalTorch(true);
    }

    await playTone(freq, durationMs);

    setStrobeLightOn(false);
    if (isTorchActiveRef.current) {
      setPhysicalTorch(false);
    }
    setCurrentMorseChar('');
  };

  // Loop Morse SOS Internasional: Tiga Pendek, Tiga Panjang, Tiga Pendek (... --- ...)
  const runSosLoop = async () => {
    const dotTime = 160;
    const dashTime = 480;
    const elementPause = 140;
    const letterPause = 360;
    const wordPause = 1400;
    const pitch = 3000; // Frekuensi standar SAR 3.000 Hz

    while (isPlayingAudioRef.current) {
      // Getar haptik ritmis SOS pada HP
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([
            160, 140, 160, 140, 160, 360,
            480, 140, 480, 140, 480, 360,
            160, 140, 160, 140, 160
          ]);
        } catch {}
      }

      // HURUF 'S': 3 Titik Pendek (Dots)
      for (let i = 0; i < 3; i++) {
        if (!isPlayingAudioRef.current) return;
        await emitPulse(pitch, dotTime, 'dot');
        await sleep(elementPause);
      }

      await sleep(letterPause);

      // HURUF 'O': 3 Garis Panjang (Dashes)
      for (let i = 0; i < 3; i++) {
        if (!isPlayingAudioRef.current) return;
        await emitPulse(pitch, dashTime, 'dash');
        await sleep(elementPause);
      }

      await sleep(letterPause);

      // HURUF 'S': 3 Titik Pendek (Dots)
      for (let i = 0; i < 3; i++) {
        if (!isPlayingAudioRef.current) return;
        await emitPulse(pitch, dotTime, 'dot');
        await sleep(elementPause);
      }

      await sleep(wordPause);
    }
  };

  // Memulai seluruh sinyal darurat secara otomatis
  const startAllDistressSignals = async () => {
    setIsPlayingAudio(true);
    isPlayingAudioRef.current = true;
    requestWakeLock();

    // Otomatis aktifkan senter fisik kamera HP jika perangkat mendukung
    if (!torchTrackRef.current && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        const track = stream.getVideoTracks()[0];
        if (track) {
          torchTrackRef.current = track;
          setIsTorchActive(true);
          isTorchActiveRef.current = true;
          setIsTorchAvailable(true);
          try {
            await track.applyConstraints({ advanced: [{ torch: false }] });
          } catch {}
        }
      } catch (err) {
        // Desktop / kamera tidak didukung ditangani secara halus
      }
    }

    try {
      await runSosLoop();
    } catch (err) {
      // Loop dihentikan
    }
  };

  // Menghentikan seluruh sinyal darurat
  const stopAllDistressSignals = () => {
    isPlayingAudioRef.current = false;
    setIsPlayingAudio(false);
    setStrobeLightOn(false);
    setCurrentMorseChar('');
    releaseWakeLock();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(0); } catch {}
    }

    if (torchTrackRef.current) {
      try {
        torchTrackRef.current.stop();
      } catch {}
      torchTrackRef.current = null;
    }
    setIsTorchActive(false);
    isTorchActiveRef.current = false;
  };

  const toggleMasterDistress = () => {
    if (isPlayingAudio) {
      stopAllDistressSignals();
    } else {
      startAllDistressSignals();
    }
  };

  const handleClose = () => {
    stopAllDistressSignals();
    setIsEcoMode(false);
    onClose();
  };

  if (!isOpen) return null;

  // SURVIVAL ECO MODE (Layar Hitam OLED untuk Menghemat Baterai saat Terjebak Berjam-jam)
  if (isEcoMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-black text-white select-none">
        <div className="w-full flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs uppercase tracking-widest font-mono text-emerald-400">SURVIVAL ECO MODE (OLED)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsEcoMode(false)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:text-white"
          >
            Tampilan Normal
          </button>
        </div>

        <div className="text-center space-y-4 my-auto relative">
          {isPlayingAudio && (
            <div className="absolute inset-0 -m-8 flex items-center justify-center pointer-events-none">
              <div className="w-36 h-36 rounded-full border border-rose-600/30 animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="w-52 h-52 rounded-full border border-rose-500/15 animate-ping" style={{ animationDuration: '2.5s' }} />
            </div>
          )}
          <div className="text-6xl font-black font-mono tracking-widest text-rose-500 relative z-10">
            {isPlayingAudio ? 'SOS' : 'JEDA'}
          </div>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            {isPlayingAudio
              ? 'Peluit akustik 3.000 Hz, senter kedip SOS, dan getar ritmis aktif otomatis. Layar dimatikan ke hitam pekat untuk memaksimalkan daya tahan baterai.'
              : 'Sinyal darurat sedang dijeda. Tekan tombol di bawah untuk membunyikan kembali.'}
          </p>

          {isTorchAvailable && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (isTorchActive) {
                    setIsTorchActive(false);
                    setPhysicalTorch(false);
                  } else {
                    setIsTorchActive(true);
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  isTorchActive
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/30' 
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                {isTorchActive ? 'Senter Kamera: KEDIP AKTIF' : 'Nyalakan Senter Kamera'}
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-md pb-6 space-y-3">
          <button
            type="button"
            onClick={toggleMasterDistress}
            className={`w-full py-5 rounded-2xl font-black text-lg border-2 flex items-center justify-center gap-2 cursor-pointer ${
              isPlayingAudio
                ? 'bg-rose-950 border-rose-500 text-rose-200'
                : 'bg-emerald-950 border-emerald-500 text-emerald-200'
            }`}
          >
            {isPlayingAudio ? '■ HENTIKAN SINYAL SOS' : '▶ BUNYIKAN KEMBALI SINYAL SOS'}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Tutup Alat Lapangan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Strobo Layar Putih Berkedip Mengikuti Ritme Morse SOS */}
      {isStrobeActive && strobeLightOn && (
        <div className="fixed inset-0 z-40 bg-white pointer-events-none transition-opacity duration-75" />
      )}

      <div className="relative z-50 bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400">
                Alat Lapangan Darurat · Aktif Otomatis
              </span>
              <h3 className="text-lg font-black text-white">
                Sinyal Beacon & Peluit SOS
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Callout Informasi Otomatis */}
        <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Sinyal darurat berbunyi dan berkedip otomatis. Menghasilkan frekuensi tajam <strong>3.000 Hz</strong>, strobo kedip SOS, dan senter fisik untuk menembus reruntuhan dan menarik perhatian Tim SAR / K9.
          </p>
        </div>

        {/* Battery Level Awareness & Eco Mode Recommendation */}
        {isBatteryLow && (
          <div className="p-3 bg-rose-950/70 border border-rose-500/60 rounded-xl text-xs flex items-center justify-between gap-2.5 animate-fadeIn">
            <div className="flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span className="text-rose-200">
                Sisa Baterai HP: <strong>{batteryLevel}%</strong>. Disarankan aktifkan Mode Hemat Daya OLED.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEcoMode(true)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black shrink-0 cursor-pointer shadow-xs"
            >
              Aktifkan Eco
            </button>
          </div>
        )}

        {/* Status Seluruh Saluran Darurat (Semua Aktif Otomatis Tanpa Perlu Disetting) */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Status Saluran Bantuan:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Volume2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold text-slate-200">Audio 3.000 Hz</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                isPlayingAudio ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {isPlayingAudio ? 'AKTIF' : 'JEDA'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Flashlight className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-slate-200">Senter Kamera</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                isTorchActive 
                  ? 'bg-amber-950 text-amber-300 border border-amber-700' 
                  : (isTorchAvailable ? 'SIAGA' : 'TIDAK DIDUKUNG')
              }`}>
                {isTorchActive ? 'KEDIP SOS' : (isTorchAvailable ? 'SIAGA' : 'TIDAK ADA')}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-slate-200">Strobo Layar</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                isStrobeActive && isPlayingAudio
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isStrobeActive && isPlayingAudio ? 'KEDIP SOS' : 'JEDA'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">Getar Haptik</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                isHapticSupported && isPlayingAudio
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isHapticSupported ? (isPlayingAudio ? 'GETAR SOS' : 'SIAGA') : 'TIDAK ADA'}
              </span>
            </div>
          </div>
        </div>

        {/* Indikator Ritme Morse Optik Real-time (... --- ...) */}
        <div className="p-2.5 bg-slate-950 border border-slate-800/90 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-400">Pola Kedip Morse Darurat:</span>
            <span className="font-mono text-amber-400">
              {strobeLightOn 
                ? (currentMorseChar === 'dot' ? 'DOT (160ms)' : 'DASH (480ms)') 
                : (isPlayingAudio ? 'JEDA ELEMENT' : 'SIAGA')}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-wider py-1 bg-slate-900 rounded-lg">
            <span className={`px-1.5 py-0.5 rounded transition-colors ${strobeLightOn && currentMorseChar === 'dot' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500'}`}>• • •</span>
            <span className="text-slate-600">/</span>
            <span className={`px-1.5 py-0.5 rounded transition-colors ${strobeLightOn && currentMorseChar === 'dash' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500'}`}>━ ━ ━</span>
            <span className="text-slate-600">/</span>
            <span className={`px-1.5 py-0.5 rounded transition-colors ${strobeLightOn && currentMorseChar === 'dot' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500'}`}>• • •</span>
          </div>
        </div>

        {/* Visual Sonar Radar Ripple Wave saat Suara Berbunyi */}
        {isPlayingAudio && (
          <div className="relative flex items-center justify-center py-4 my-1 overflow-hidden">
            <div className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping" style={{ animationDuration: '1.2s' }} />
            <div className="absolute w-40 h-40 rounded-full border border-rose-500/40 animate-pulse" style={{ animationDuration: '0.8s' }} />
            <div className="absolute w-52 h-52 rounded-full border border-rose-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative z-10 px-3.5 py-1.5 rounded-full bg-rose-950/90 border border-rose-500/60 text-rose-300 text-[11px] font-mono font-bold flex items-center gap-2 shadow-lg shadow-rose-950/80">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span>FREKUENSI 3.000 HZ AKTIF · RADAR SUARA TEMBUS PUING</span>
            </div>
          </div>
        )}

        {/* TOMBOL UTAMA KENDALI MASTER */}
        <div className="pt-2">
          <button
            type="button"
            onClick={toggleMasterDistress}
            className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg transform active:scale-[0.98] ${
              isPlayingAudio
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/50 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/50'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-6 h-6 fill-current" />
                <span>HENTIKAN SINYAL SOS</span>
              </>
            ) : (
              <>
                <Volume2 className="w-6 h-6" />
                <span>BUNYIKAN KEMBALI SINYAL SOS</span>
              </>
            )}
          </button>
        </div>

        {/* Tombol Survival Mode Layar Hitam OLED */}
        <button
          type="button"
          onClick={() => setIsEcoMode(true)}
          className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
          <span>Aktifkan Mode Hemat Daya Ekstrem (OLED Black)</span>
        </button>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          Berjalan 100% offline via Web Audio API browser tanpa kuota internet.
        </div>
      </div>
    </div>
  );
}
