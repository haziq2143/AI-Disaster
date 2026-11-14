let cachedData = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 detik cache untuk menghormati server BMKG

export async function GET() {
  const now = Date.now();

  // Kembalikan cache jika masih dalam batas TTL
  if (cachedData && (now - lastFetchTime < CACHE_TTL_MS)) {
    return Response.json({
      success: true,
      source: 'bmkg_cache',
      data: cachedData
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GuardianShield-DisasterAssistant/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`BMKG server responded with status: ${response.status}`);
    }

    const json = await response.json();
    const gempa = json?.Infogempa?.gempa;

    if (!gempa) {
      throw new Error('Format respon data BMKG tidak sesuai');
    }

    // Parse koordinat "-5.56,102.24" -> [latitude, longitude]
    let coordinates = null;
    if (gempa.Coordinates) {
      const parts = gempa.Coordinates.split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        coordinates = {
          lat: parts[0],
          lng: parts[1]
        };
      }
    }

    const processedData = {
      tanggal: gempa.Tanggal,
      jam: gempa.Jam,
      dateTime: gempa.DateTime,
      coordinates: coordinates,
      lintang: gempa.Lintang,
      bujur: gempa.Bujur,
      magnitude: gempa.Magnitude,
      kedalaman: gempa.Kedalaman,
      wilayah: gempa.Wilayah,
      potensi: gempa.Potensi,
      dirasakan: gempa.Dirasakan || null,
      shakemapUrl: gempa.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}` : null,
      updatedAt: new Date().toISOString()
    };

    cachedData = processedData;
    lastFetchTime = now;

    return Response.json({
      success: true,
      source: 'bmkg_live',
      data: processedData
    });
  } catch (error) {
    console.warn('[BMKG API Error]', error.message);

    // Fallback data jika BMKG offline atau timeout
    if (cachedData) {
      return Response.json({
        success: true,
        source: 'bmkg_stale_cache',
        data: cachedData,
        warning: 'Gagal memperbarui data terkini; menampilkan data cache sebelumnya.'
      });
    }

    return Response.json({
      success: false,
      error: 'Layanan informasi gempa BMKG sedang tidak dapat dihubungi.',
      details: error.message
    }, { status: 502 });
  }
}
