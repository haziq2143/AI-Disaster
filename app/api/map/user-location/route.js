import { NextResponse } from 'next/server';
import { saveUserLocation } from '../../../../src/lib/disasterDb.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { lat, lng, accuracy, precision_consent, status } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Koordinat GPS aktual (lat, lng) diperlukan.' },
        { status: 400 }
      );
    }

    const saved = saveUserLocation({
      lat,
      lng,
      accuracy: accuracy || 10,
      precision_consent: Boolean(precision_consent),
      status: status || 'checking'
    });

    return NextResponse.json({
      success: true,
      message: precision_consent
        ? 'Koordinat GPS aktual presisi diaktifkan untuk mode darurat.'
        : 'Koordinat GPS disimpan. Tampilan publik dilindungi radius perkiraan 1 km.',
      data: saved
    });
  } catch (error) {
    console.error('API /api/map/user-location error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan lokasi GPS pengguna.' },
      { status: 500 }
    );
  }
}
