import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Flashlight, 
  AlertTriangle, 
  X, 
  Radio, 
  Play, 
  Square, 
  Sparkles,
  Zap,
  BatteryCharging,
  Smartphone
} from 'lucide-react';

export default function SignalBeaconModal({ isOpen, onClose }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [beaconMode, setBeaconMode] = useState('sos'); // 'sos' | 'continuous' | 'pulse'
  const [isStrobeActive, setIsStrobeActive] = useState(true);
  const [strobeLightOn, setStrobeLightOn] = useState(false);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  const [isTorchActive, setIsTorchActive] = useState(false);
  const [isEcoMode, setIsEcoMode] = useState(false);
  const [isHapticSupported, setIsHapticSupported] = useState(false);
  const [currentMorseChar, setCurrentMorseChar] = useState(''); // 'dot' | 'dash' | 'pause'

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const torchTrackRef = useRef(null);
  const isPlayingAudioRef = useRef(false);
  const isTorchActiveRef = useRef(isTorchActive);
  const silentTorchLoopRef = useRef(false);

  useEffect(() => {
    isTorchActiveRef.current = isTorchActive;
  }, [isTorchActive]);

  useEffect(() => {
    isPlayingAudioRef.current = isPlayingAudio;
  }, [isPlayingAudio]);

  // Periksa dukungan Torch API & Vibration API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      setIsHapticSupported(true);
    }

    async function checkTorchSupport() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getSupportedConstraints) return;
      const constraints = navigator.mediaDevices.getSupportedConstraints();
      if (constraints.torch) {
        setIsTorchAvailable(true);
      }
    }
    checkTorchSupport();

    return () => {
      stopAudio();
      stopTorch();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

        // Frekuensi tajam menusuk (3000 Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Attack & decay lembut untuk menghindari suara 'pop' speaker
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.85, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (durationMs / 1000) - 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + (durationMs / 1000));

        osc.onended = () => {
          resolve();
        };
      } catch (err) {
        console.error('Audio play error', err);
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
        // fallback browser
      }
    }
  };

  const stopTorch = () => {
    silentTorchLoopRef.current = false;
    if (torchTrackRef.current) {
      try {
        torchTrackRef.current.stop();
      } catch {}
      torchTrackRef.current = null;
    }
    setIsTorchActive(false);
  };

  const startTorch = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      const track = stream.getVideoTracks()[0];
      if (track) {
        torchTrackRef.current = track;
        setIsTorchActive(true);
        await track.applyConstraints({ advanced: [{ torch: false }] });
        if (!isPlayingAudioRef.current) {
          runSilentTorchSos();
        }
      }
    } catch (err) {
      console.warn('Torch activation failed', err);
      setIsTorchActive(false);
    }
  };

  const toggleTorch = () => {
    if (isTorchActive) {
      stopTorch();
    } else {
      startTorch();
    }
  };

  // Loop kedip SOS Morse mandiri saat senter dinyalakan tanpa suara peluit
  const runSilentTorchSos = async () => {
    silentTorchLoopRef.current = true;
    const dotTime = 160;
    const dashTime = 480;
    const elementPause = 140;
    const letterPause = 360;
    const wordPause = 1400;

    while (silentTorchLoopRef.current && isTorchActiveRef.current && !isPlayingAudioRef.current) {
      // 3 Titik Pendek (S)
      for (let i = 0; i < 3; i++) {
        if (!silentTorchLoopRef.current || !isTorchActiveRef.current || isPlayingAudioRef.current) return;
        setStrobeLightOn(true);
        setCurrentMorseChar('dot');
        await setPhysicalTorch(true);
        await sleep(dotTime);
        setStrobeLightOn(false);
        setCurrentMorseChar('');
        await setPhysicalTorch(false);
        await sleep(elementPause);
      }
      await sleep(letterPause);

      // 3 Garis Panjang (O)
      for (let i = 0; i < 3; i++) {
        if (!silentTorchLoopRef.current || !isTorchActiveRef.current || isPlayingAudioRef.current) return;
        setStrobeLightOn(true);
        setCurrentMorseChar('dash');
        await setPhysicalTorch(true);
        await sleep(dashTime);
        setStrobeLightOn(false);
        setCurrentMorseChar('');
        await setPhysicalTorch(false);
        await sleep(elementPause);
      }
      await sleep(letterPause);

      // 3 Titik Pendek (S)
      for (let i = 0; i < 3; i++) {
        if (!silentTorchLoopRef.current || !isTorchActiveRef.current || isPlayingAudioRef.current) return;
        setStrobeLightOn(true);
        setCurrentMorseChar('dot');
        await setPhysicalTorch(true);
        await sleep(dotTime);
        setStrobeLightOn(false);
        setCurrentMorseChar('');
        await setPhysicalTorch(false);
        await sleep(elementPause);
      }
      await sleep(wordPause);
    }
  };

  const stopAudio = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(0); } catch {}
    }
    setIsPlayingAudio(false);
    setStrobeLightOn(false);
    setCurrentMorseChar('');
    if (isTorchActiveRef.current) {
      setPhysicalTorch(false);
      // Jika senter masih di-toggle aktif, lanjutkan kedip senter tanpa suara
      if (!silentTorchLoopRef.current) {
        runSilentTorchSos();
      }
    }
  };

  // Helper pulsa optik dan audio sinkron (Morse Element)
  const emitPulse = async (freq, durationMs, charType) => {
    setCurrentMorseChar(charType);
    setStrobeLightOn(true);
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

  // Loop Pola SOS Morse (... --- ...) dengan Kedipan Senter & Layar Sinkron
  const runSosLoop = async () => {
    const dotTime = 160;
    const dashTime = 480;
    const elementPause = 140;
    const letterPause = 360;
    const wordPause = 1400;
    const pitch = 3000; // 3kHz frekuensi tajam

    while (isPlayingAudioRef.current) {
      // Haptik getar ritmis pola SOS Morse untuk korban dalam reruntuhan / saku
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

  // Loop Sirene Kontinu / Melengking Cepat
  const runSirenLoop = async () => {
    while (isPlayingAudioRef.current) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([380, 80, 380, 150]); } catch {}
      }
      await emitPulse(3200, 380, 'dash');
      await sleep(80);
      await emitPulse(2600, 380, 'dash');
      await sleep(150);
    }
  };

  const toggleAudioSignal = async () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      setIsPlayingAudio(true);
      isPlayingAudioRef.current = true;
      try {
        if (beaconMode === 'sos') {
          await runSosLoop();
        } else {
          await runSirenLoop();
        }
      } catch (err) {
        stopAudio();
      }
    }
  };

  if (!isOpen) return null;

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
            {isPlayingAudio ? 'SOS' : 'IDLE'}
          </div>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            {isPlayingAudio
              ? 'Audio beacon 3.000 Hz dan getar Morse aktif. Layar dimatikan ke hitam pekat untuk menghemat daya baterai hingga 3x lipat.'
              : 'Sinyal suara sedang jeda. Tekan tombol di bawah untuk mengaktifkan.'}
          </p>
          {isTorchAvailable && (
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleTorch}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  isTorchActive
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/30' 
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                {isTorchActive ? 'Senter Kedip SOS: AKTIF' : 'Nyalakan Senter Kedip SOS'}
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-md pb-6 space-y-3">
          <button
            type="button"
            onClick={toggleAudioSignal}
            className={`w-full py-5 rounded-2xl font-black text-lg border-2 flex items-center justify-center gap-2 ${
              isPlayingAudio
                ? 'bg-rose-950 border-rose-500 text-rose-200'
                : 'bg-emerald-950 border-emerald-500 text-emerald-200'
            }`}
          >
            {isPlayingAudio ? '■ HENTIKAN SUARA BEACON' : '▶ AKTIFKAN SUARA BEACON'}
          </button>

          <button
            type="button"
            onClick={() => {
              stopAudio();
              stopTorch();
              setIsEcoMode(false);
              onClose();
            }}
            className="w-full py-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-slate-200"
          >
            Tutup Alat Lapangan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Dynamic Strobe Screen Background */}
      {isStrobeActive && strobeLightOn && (
        <div className="fixed inset-0 z-40 bg-white pointer-events-none transition-opacity duration-75" />
      )}

      <div className="relative z-50 bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400">
                Alat Lapangan Darurat
              </span>
              <h3 className="text-lg font-black text-white">
                Sinyal Beacon & Peluit SOS
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopAudio();
              stopTorch();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning callout */}
        <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Menghasilkan frekuensi tinggi <strong>3.000 Hz</strong> untuk menembus reruntuhan dan kebisingan sekitar. Naikkan volume HP ke maksimal saat terjebak.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400">Pola Bunyi & Sinyal:</label>
            {isHapticSupported && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span>Getar Morse Aktif</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (isPlayingAudio) stopAudio();
                setBeaconMode('sos');
              }}
              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                beaconMode === 'sos'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-mono text-sm">... --- ...</div>
              <div className="text-[10px] opacity-80 mt-0.5">Kode Morse SOS Standar</div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isPlayingAudio) stopAudio();
                setBeaconMode('continuous');
              }}
              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                beaconMode === 'continuous'
                  ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-sm">Sirene Peluit</div>
              <div className="text-[10px] opacity-80 mt-0.5">Pulsa Melengking Cepat</div>
            </button>
          </div>
        </div>

        {/* Strobe & Flashlight Options */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsStrobeActive(!isStrobeActive)}
              className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                isStrobeActive
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Kedip Layar</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 font-mono">
                {isStrobeActive ? 'AKTIF' : 'MATI'}
              </span>
            </button>

            {isTorchAvailable ? (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  isTorchActive
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flashlight className="w-4 h-4" />
                  <span>Senter Kedip SOS</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono">
                  {isTorchActive ? 'KEDIP SOS' : 'OFF'}
                </span>
              </button>
            ) : (
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-850/40 text-[11px] text-slate-500 flex items-center gap-2">
                <Flashlight className="w-4 h-4 text-slate-600" />
                <span>Senter fisik tidak didukung web</span>
              </div>
            )}
          </div>

          {/* Indikator Ritme Morse Optik Real-time */}
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
        </div>

        {/* Ultra Eco Mode Survival Switch */}
        <button
          type="button"
          onClick={() => setIsEcoMode(true)}
          className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
          <span>Aktifkan Mode Hemat Daya Ekstrem (OLED Black)</span>
        </button>

        {/* Visual Sonar Radar Ripple Wave when Audio is Playing */}
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

        {/* BIG ACTION TOGGLE BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={toggleAudioSignal}
            className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg transform active:scale-[0.98] ${
              isPlayingAudio
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/50 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/50'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-6 h-6 fill-current" />
                <span>HENTIKAN SINYAL SUARA</span>
              </>
            ) : (
              <>
                <Volume2 className="w-6 h-6" />
                <span>BUNYIKAN PELUIT DARURAT</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          Berjalan 100% offline via Web Audio API browser tanpa kuota internet.
        </div>
      </div>
    </div>
  );
}
