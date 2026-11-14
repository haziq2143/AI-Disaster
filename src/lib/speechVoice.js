// Helper terpusat untuk Text-to-Speech (TTS) Bahasa Indonesia
// Menggunakan 100% Suara Wanita Bahasa Indonesia Alami (Natural Indonesian Female Voice)
// Bebas David / suara robotik bahasa Inggris bawaan OS.

let currentAudioInstance = null;
let activeSpeechSession = 0;

// Cache memory URL audio untuk langkah-langkah yang di-preload
const preloadedUrls = new Set();

export function stopSpeaking() {
  activeSpeechSession++;

  if (currentAudioInstance) {
    try {
      currentAudioInstance.onplay = null;
      currentAudioInstance.onended = null;
      currentAudioInstance.onerror = null;
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
      currentAudioInstance.src = '';
    } catch {}
    currentAudioInstance = null;
  }

  // Bersihkan dan batalkan sintesis lokal jika pernah aktif di tab lain
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function preloadIndonesianAudio(text) {
  if (typeof window === 'undefined' || !text) return;
  const clean = text
    .replace(/[#*_`~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || preloadedUrls.has(clean)) return;

  preloadedUrls.add(clean);
  try {
    const url = `/api/tts?text=${encodeURIComponent(clean.slice(0, 500))}`;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
  } catch {}
}

export function speakIndonesian(text, options = {}) {
  // Hentikan audio sebelumnya seketika (anti-nabrak)
  stopSpeaking();
  if (!text) return null;

  const cleanText = text
    .replace(/[#*_`~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return null;

  const mySession = ++activeSpeechSession;

  try {
    const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText.slice(0, 500))}`;
    const audio = new Audio(audioUrl);
    currentAudioInstance = audio;

    if (options.rate && options.rate !== 1) {
      audio.playbackRate = options.rate;
    }

    audio.onplay = () => {
      if (mySession !== activeSpeechSession) {
        try { audio.pause(); } catch {}
        return;
      }
      if (options.onstart) options.onstart();
    };

    audio.onended = () => {
      if (mySession === activeSpeechSession) {
        currentAudioInstance = null;
        if (options.onend) options.onend();
      }
    };

    audio.onerror = () => {
      if (mySession === activeSpeechSession) {
        currentAudioInstance = null;
        if (options.onerror) options.onerror(new Error('Audio playback error'));
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Abaikan jika dihentikan karena beralih langkah navigasi
        if (mySession !== activeSpeechSession) return;
        if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
          return;
        }
        if (options.onerror) options.onerror(err);
      });
    }

    return audio;
  } catch (err) {
    if (options.onerror) options.onerror(err);
    return null;
  }
}
