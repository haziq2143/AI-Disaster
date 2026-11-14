// Helper terpusat untuk Text-to-Speech (TTS) Bahasa Indonesia
// Mengatasi masalah umum browser Windows/Chromium di mana getVoices() belum siap
// atau OS tidak memiliki suara id-ID sehingga memakai suara English.

let cachedIndonesianVoice = null;
let voicesLoaded = false;

export function getIndonesianVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (cachedIndonesianVoice) return cachedIndonesianVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Prioritas Utama: Suara Bahasa Indonesia resmi (id-ID, id_ID, atau nama 'Indonesia')
  const directId = voices.find(v => 
    v.lang.toLowerCase() === 'id-id' || 
    v.lang.toLowerCase() === 'id_id' || 
    v.lang.toLowerCase() === 'id' ||
    v.name.toLowerCase().includes('indonesia') ||
    v.name.toLowerCase().includes('gadis') ||
    v.name.toLowerCase().includes('ardi')
  );
  if (directId) {
    cachedIndonesianVoice = directId;
    return directId;
  }

  // 2. Prioritas Cadangan: Suara Bahasa Melayu (ms-MY / ms)
  // Bahasa Melayu memiliki sistem fonetik vokal (a, i, u, e, o) dan konsonan yang hampir identik dengan Bahasa Indonesia,
  // sehingga pelafalan terdengar sangat natural ketimbang suara English (David/Mark) membaca teks Indonesia.
  const malayVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith('ms') || 
    v.name.toLowerCase().includes('melayu') || 
    v.name.toLowerCase().includes('malay')
  );
  if (malayVoice) {
    cachedIndonesianVoice = malayVoice;
    return malayVoice;
  }

  return null;
}

// Inisialisasi listener onvoiceschanged segera setelah script dimuat di client
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
    cachedIndonesianVoice = null;
    getIndonesianVoice();
  };
}

export function speakIndonesian(text, options = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  window.speechSynthesis.cancel();
  if (!text) return null;

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getIndonesianVoice();

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'id-ID';
  }

  utterance.rate = options.rate || 0.93;
  utterance.pitch = options.pitch || 1.0;

  if (options.onstart) utterance.onstart = options.onstart;
  if (options.onend) utterance.onend = options.onend;
  if (options.onerror) utterance.onerror = options.onerror;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
