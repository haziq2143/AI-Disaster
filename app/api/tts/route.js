export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawText = searchParams.get('text');

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return new Response(JSON.stringify({ error: 'Parameter text diperlukan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Bersihkan teks: buang simbol markdown atau formatting berlebih
    const cleanText = rawText
      .replace(/[#*_`~[\]()]/g, ' ')
      .replace(/[^\p{L}\p{N}\s,.-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 600);

    if (!cleanText) {
      return new Response(JSON.stringify({ error: 'Teks tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Google Translate TTS membatasi maksimal ~180-200 karakter per request.
    // Kita pecah menjadi segmen-segmen kalimat alami jika teks panjang.
    const chunks = [];
    if (cleanText.length <= 180) {
      chunks.push(cleanText);
    } else {
      const sentences = cleanText.split(/([.,!?]+)/);
      let currentChunk = '';
      for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        if ((currentChunk + part).length <= 180) {
          currentChunk += part;
        } else {
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          currentChunk = part.trim();
        }
      }
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }

    const audioBuffers = await Promise.all(
      chunks.slice(0, 4).map(async (chunk) => {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(ttsUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Google TTS error: ${response.status}`);
        }
        return Buffer.from(await response.arrayBuffer());
      })
    );

    const mergedBuffer = Buffer.concat(audioBuffers);

    return new Response(mergedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
        'Content-Length': String(mergedBuffer.length)
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Kesalahan server TTS' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
